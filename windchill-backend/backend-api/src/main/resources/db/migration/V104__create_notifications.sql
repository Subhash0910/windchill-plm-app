-- V104: Create notifications table
-- Stores in-app notifications for all PLM events (part lifecycle, worklist tasks, ECR changes)

CREATE TABLE IF NOT EXISTS notifications
(
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT       NOT NULL,
    title         VARCHAR(255) NOT NULL,
    message       TEXT,
    type          VARCHAR(50)  NOT NULL DEFAULT 'INFO',
    entity_type   VARCHAR(50),
    entity_id     BIGINT,
    entity_number VARCHAR(100),
    is_read       TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    DATETIME              DEFAULT CURRENT_TIMESTAMP,
    read_at       DATETIME              NULL,
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_user_unread (user_id, is_read)
);
