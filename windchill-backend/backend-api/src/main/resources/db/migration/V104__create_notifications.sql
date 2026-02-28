-- V104: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT,
    type       VARCHAR(50)  NOT NULL DEFAULT 'INFO',
    entity_type VARCHAR(100),
    entity_id  BIGINT,
    entity_number VARCHAR(100),
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at    DATETIME     NULL,
    PRIMARY KEY (id),
    INDEX idx_notifications_user_id    (user_id),
    INDEX idx_notifications_user_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
