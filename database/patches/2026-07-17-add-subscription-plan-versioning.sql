-- Apply once on MySQL 8 before starting the versioned-subscription backend.
-- Rollback guidance is documented at the bottom; do not drop version rows while referenced.

ALTER TABLE subscription_plans
    ADD COLUMN download_limit INT NOT NULL DEFAULT 0 AFTER ai_requests_per_day,
    ADD COLUMN bookmark_limit INT NOT NULL DEFAULT 0 AFTER download_limit,
    ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

CREATE TABLE subscription_plan_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    subscription_plan_id BIGINT NOT NULL,
    version_number INT NOT NULL,
    plan_name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(12,2) NOT NULL,
    storage_limit_mb BIGINT NOT NULL,
    ai_requests_per_day INT NOT NULL,
    download_limit INT NOT NULL DEFAULT 0,
    bookmark_limit INT NOT NULL DEFAULT 0,
    duration_days INT NOT NULL,
    can_use_ai_summary BOOLEAN NOT NULL,
    can_use_flashcards BOOLEAN NOT NULL,
    can_use_quizzes BOOLEAN NOT NULL,
    can_publish_documents BOOLEAN NOT NULL,
    can_publish_folders BOOLEAN NOT NULL,
    effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_plan_version UNIQUE (subscription_plan_id, version_number),
    CONSTRAINT fk_plan_versions_plan FOREIGN KEY (subscription_plan_id)
        REFERENCES subscription_plans(id)
);

INSERT INTO subscription_plan_versions (
    subscription_plan_id, version_number, plan_name, description, price, storage_limit_mb, ai_requests_per_day,
    download_limit, bookmark_limit, duration_days, can_use_ai_summary, can_use_flashcards,
    can_use_quizzes, can_publish_documents, can_publish_folders, effective_from, created_at
)
SELECT id, 1, plan_name, description, price, storage_limit_mb, ai_requests_per_day, download_limit, bookmark_limit,
       duration_days, can_use_ai_summary, can_use_flashcards, can_use_quizzes,
       can_publish_documents, can_publish_folders, created_at, created_at
FROM subscription_plans;

ALTER TABLE user_subscriptions
    ADD COLUMN plan_version_id BIGINT NULL AFTER plan_id,
    ADD COLUMN payment_id BIGINT NULL AFTER plan_version_id,
    ADD COLUMN auto_renew BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active,
    ADD COLUMN price_paid DECIMAL(12,2) NULL AFTER auto_renew,
    ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

UPDATE user_subscriptions subscription
JOIN subscription_plan_versions version
  ON version.subscription_plan_id = subscription.plan_id AND version.version_number = 1
SET subscription.plan_version_id = version.id,
    subscription.price_paid = COALESCE(subscription.price_paid, version.price);

-- FREE users in older installations only had users.plan_id and no subscription row.
INSERT INTO user_subscriptions (
    user_id, plan_id, plan_version_id, start_date, end_date, is_active,
    auto_renew, price_paid, created_at, updated_at
)
SELECT user.id, plan.id, version.id, CURRENT_TIMESTAMP, NULL, TRUE,
       FALSE, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users user
JOIN subscription_plans plan ON plan.id = user.plan_id AND plan.plan_name = 'FREE'
JOIN subscription_plan_versions version
  ON version.subscription_plan_id = plan.id AND version.version_number = 1
WHERE NOT EXISTS (
    SELECT 1 FROM user_subscriptions existing
    WHERE existing.user_id = user.id AND existing.is_active = TRUE
);

ALTER TABLE subscription_payments
    ADD COLUMN current_plan_version_id BIGINT NULL AFTER target_plan_id,
    ADD COLUMN target_plan_version_id BIGINT NULL AFTER current_plan_version_id,
    ADD COLUMN original_amount DECIMAL(12,2) NULL AFTER amount,
    ADD COLUMN remaining_value DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER original_amount,
    ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'VND' AFTER remaining_value,
    ADD COLUMN idempotency_key VARCHAR(100) NULL AFTER currency,
    ADD COLUMN failure_reason VARCHAR(500) NULL AFTER provider_transaction_ref;

UPDATE subscription_payments payment
LEFT JOIN subscription_plan_versions current_version
  ON current_version.subscription_plan_id = payment.current_plan_id AND current_version.version_number = 1
JOIN subscription_plan_versions target_version
  ON target_version.subscription_plan_id = payment.target_plan_id AND target_version.version_number = 1
SET payment.current_plan_version_id = current_version.id,
    payment.target_plan_version_id = target_version.id,
    payment.original_amount = target_version.price,
    payment.idempotency_key = payment.payment_code;

UPDATE user_subscriptions subscription
JOIN subscription_payments payment
  ON payment.user_id = subscription.user_id
 AND payment.target_plan_id = subscription.plan_id
 AND payment.status = 'PAID'
 AND payment.paid_at BETWEEN subscription.start_date - INTERVAL 5 MINUTE AND subscription.start_date + INTERVAL 5 MINUTE
SET subscription.payment_id = payment.id,
    subscription.price_paid = payment.amount
WHERE subscription.payment_id IS NULL;

ALTER TABLE user_subscriptions
    MODIFY plan_version_id BIGINT NOT NULL,
    ADD CONSTRAINT uk_user_subscriptions_payment UNIQUE (payment_id),
    ADD CONSTRAINT fk_user_subscriptions_plan_version FOREIGN KEY (plan_version_id)
        REFERENCES subscription_plan_versions(id),
    ADD CONSTRAINT fk_user_subscriptions_payment FOREIGN KEY (payment_id)
        REFERENCES subscription_payments(id);

ALTER TABLE subscription_payments
    MODIFY target_plan_version_id BIGINT NOT NULL,
    MODIFY original_amount DECIMAL(12,2) NOT NULL,
    MODIFY idempotency_key VARCHAR(100) NOT NULL,
    ADD CONSTRAINT uk_subscription_payment_idempotency UNIQUE (idempotency_key),
    ADD CONSTRAINT uk_subscription_payment_provider_ref UNIQUE (provider_transaction_ref),
    ADD CONSTRAINT fk_payments_current_plan_version FOREIGN KEY (current_plan_version_id)
        REFERENCES subscription_plan_versions(id),
    ADD CONSTRAINT fk_payments_target_plan_version FOREIGN KEY (target_plan_version_id)
        REFERENCES subscription_plan_versions(id);

CREATE INDEX idx_plan_versions_plan ON subscription_plan_versions(subscription_plan_id, version_number);
CREATE INDEX idx_user_subscriptions_plan_version ON user_subscriptions(plan_version_id);
CREATE INDEX idx_payments_target_plan_version ON subscription_payments(target_plan_version_id);

-- Rollback (only before new versioned purchases): drop the added FKs/indexes/columns and
-- subscription_plan_versions. Preserve a database backup because version-specific benefits
-- cannot be reconstructed after new plan versions have been used.
