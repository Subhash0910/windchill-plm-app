CREATE TABLE IF NOT EXISTS change_activities (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    eco_id       BIGINT       NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  LONGTEXT,
    assignee     VARCHAR(100),
    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    due_date     DATE,
    completed_at TIMESTAMP,
    completed_by VARCHAR(100),
    created_by   VARCHAR(100),
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ca_eco FOREIGN KEY (eco_id) REFERENCES change_orders(id) ON DELETE CASCADE,
    INDEX idx_ca_eco (eco_id),
    INDEX idx_ca_assignee (assignee)
);
