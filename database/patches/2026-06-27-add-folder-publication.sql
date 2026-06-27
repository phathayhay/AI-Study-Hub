ALTER TABLE folders
    ADD COLUMN visibility ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PRIVATE' AFTER parent_folder_id,
    ADD COLUMN published_at TIMESTAMP NULL AFTER visibility;

CREATE INDEX idx_folders_visibility ON folders(visibility);
