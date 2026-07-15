ALTER TABLE users
    ADD COLUMN storage_status ENUM('NORMAL', 'OVER_QUOTA') NOT NULL DEFAULT 'NORMAL'
    AFTER verification_status;
