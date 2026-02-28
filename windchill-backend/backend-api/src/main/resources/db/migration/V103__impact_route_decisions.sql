CREATE TABLE IF NOT EXISTS impact_route_decisions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    report_id BIGINT NOT NULL,
    ecr_id BIGINT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    requested_reviewers_csv TEXT NULL,
    added_reviewers_csv TEXT NULL,
    applied_rules_json TEXT NULL,
    explanation TEXT NULL,
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    KEY idx_impact_route_report (report_id),
    KEY idx_impact_route_ecr (ecr_id)
) ENGINE=InnoDB;
