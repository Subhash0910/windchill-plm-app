-- V109: File Attachments — generic attachment table for PART, DOCUMENT, ECO, ECR
CREATE TABLE IF NOT EXISTS file_attachments (
    id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
    entity_type       VARCHAR(30)  NOT NULL,
    entity_id         BIGINT       NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename   VARCHAR(255) NOT NULL,
    storage_path      VARCHAR(512) NOT NULL,
    content_type      VARCHAR(128),
    file_size         BIGINT,
    category          VARCHAR(50),
    uploaded_by       VARCHAR(100),
    uploaded_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_fa_entity (entity_type, entity_id),
    INDEX idx_fa_uploader (uploaded_by)
);
