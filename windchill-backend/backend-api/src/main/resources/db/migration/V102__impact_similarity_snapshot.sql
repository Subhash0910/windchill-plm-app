CREATE TABLE IF NOT EXISTS impact_similar_changes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    report_id BIGINT NOT NULL,
    similar_ecr_id BIGINT NOT NULL,
    score INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    KEY idx_impact_similar_report (report_id),
    KEY idx_impact_similar_ecr (similar_ecr_id)
) ENGINE=InnoDB;
