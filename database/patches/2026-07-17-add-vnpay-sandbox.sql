-- Additive VNPAY Sandbox audit fields. Existing payment history is preserved.
ALTER TABLE subscription_payments
    ADD COLUMN discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER remaining_value,
    ADD COLUMN payment_mode VARCHAR(20) NULL AFTER provider_name,
    ADD COLUMN vnp_txn_ref VARCHAR(100) NULL AFTER payment_mode,
    ADD COLUMN vnp_transaction_no VARCHAR(100) NULL AFTER vnp_txn_ref,
    ADD COLUMN vnp_bank_tran_no VARCHAR(100) NULL AFTER vnp_transaction_no,
    ADD COLUMN vnp_bank_code VARCHAR(30) NULL AFTER vnp_bank_tran_no,
    ADD COLUMN vnp_card_type VARCHAR(30) NULL AFTER vnp_bank_code,
    ADD COLUMN vnp_response_code VARCHAR(10) NULL AFTER vnp_card_type,
    ADD COLUMN vnp_transaction_status VARCHAR(10) NULL AFTER vnp_response_code,
    ADD COLUMN vnp_pay_date VARCHAR(20) NULL AFTER vnp_transaction_status;

UPDATE subscription_payments
SET discount_amount = remaining_value
WHERE discount_amount = 0 AND remaining_value > 0;

CREATE UNIQUE INDEX uk_subscription_payments_vnp_txn_ref
    ON subscription_payments(vnp_txn_ref);
CREATE UNIQUE INDEX uk_subscription_payments_vnp_transaction_no
    ON subscription_payments(vnp_transaction_no);
