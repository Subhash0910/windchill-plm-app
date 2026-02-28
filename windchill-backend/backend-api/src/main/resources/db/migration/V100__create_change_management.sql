CREATE TABLE IF NOT EXISTS change_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    number VARCHAR(64) NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    context_type VARCHAR(64) NULL,
    context_id VARCHAR(64) NULL,
    status VARCHAR(32) NOT NULL,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_change_requests_number (number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS change_notices (
    id BIGINT NOT NULL AUTO_INCREMENT,
    number VARCHAR(64) NULL,
    origin_ecr_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_by VARCHAR(128) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_change_notices_number (number),
    UNIQUE KEY uk_change_notices_origin_ecr (origin_ecr_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS change_tasks (
    id BIGINT NOT NULL AUTO_INCREMENT,
    change_request_id BIGINT NULL,
    change_notice_id BIGINT NULL,
    type VARCHAR(32) NOT NULL,
    decision VARCHAR(32) NOT NULL,
    assignee VARCHAR(128) NOT NULL,
    comment TEXT NULL,
    decided_by VARCHAR(128) NULL,
    decided_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    KEY idx_change_tasks_assignee (assignee),
    KEY idx_change_tasks_change_request (change_request_id),
    KEY idx_change_tasks_change_notice (change_notice_id)
) ENGINE=InnoDB;
