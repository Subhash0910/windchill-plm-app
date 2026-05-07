CREATE TABLE IF NOT EXISTS work_item_comments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    promotion_request_id BIGINT NOT NULL,
    work_item_id BIGINT NOT NULL,
    commented_by_user_id BIGINT NOT NULL,
    comment VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version BIGINT DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_wic_work_item (work_item_id),
    INDEX idx_wic_pr (promotion_request_id),
    CONSTRAINT fk_wic_work_item FOREIGN KEY (work_item_id) REFERENCES work_items(id),
    CONSTRAINT fk_wic_promotion_request FOREIGN KEY (promotion_request_id) REFERENCES promotion_requests(id)
) ENGINE=InnoDB;
