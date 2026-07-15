CREATE TABLE IF NOT EXISTS subscription_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    current_plan_id BIGINT NULL,
    target_plan_id BIGINT NOT NULL,
    payment_code VARCHAR(64) NOT NULL UNIQUE,
    transfer_content VARCHAR(128) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM(
        'PENDING',
        'PAID',
        'EXPIRED',
        'FAILED',
        'CANCELLED'
    ) DEFAULT 'PENDING',
    bank_name VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    qr_code_url VARCHAR(500),
    expires_at TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    provider_name VARCHAR(100),
    provider_transaction_ref VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_subscription_payments_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_subscription_payments_current_plan
        FOREIGN KEY(current_plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_subscription_payments_target_plan
        FOREIGN KEY(target_plan_id)
        REFERENCES subscription_plans(id)
);

CREATE INDEX idx_subscription_payments_user
ON subscription_payments(user_id);

CREATE INDEX idx_subscription_payments_target_plan
ON subscription_payments(target_plan_id);

CREATE INDEX idx_subscription_payments_status
ON subscription_payments(status);

CREATE INDEX idx_subscription_payments_created
ON subscription_payments(created_at);
