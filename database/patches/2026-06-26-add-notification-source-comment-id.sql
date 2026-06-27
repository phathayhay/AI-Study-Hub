ALTER TABLE notifications
    ADD COLUMN source_comment_id BIGINT NULL AFTER is_read;

CREATE INDEX idx_notifications_source_comment
    ON notifications(source_comment_id);
