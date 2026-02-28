CREATE TABLE IF NOT EXISTS impact_reports (
    id BIGINT NOT NULL AUTO_INCREMENT,
    ecr_id BIGINT NOT NULL,
    root_object_type VARCHAR(50) NOT NULL,
    root_object_id VARCHAR(64) NOT NULL,
    score INT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    factors_json TEXT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    KEY idx_impact_reports_ecr (ecr_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS impact_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    report_id BIGINT NOT NULL,
    object_type VARCHAR(50) NOT NULL,
    object_id VARCHAR(64) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    depth INT NOT NULL,
    path_hint VARCHAR(255) NULL,
    PRIMARY KEY (id),
    KEY idx_impact_items_report (report_id),
    KEY idx_impact_items_object (object_type, object_id)
) ENGINE=InnoDB;
