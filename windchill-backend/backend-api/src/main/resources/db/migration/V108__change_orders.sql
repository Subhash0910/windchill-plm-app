-- V108: Change Orders (ECO) and Change Order Items
-- Sits between ChangeRequest (ECR) and ChangeNotice in the pipeline

CREATE TABLE IF NOT EXISTS change_orders (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    eco_number      VARCHAR(40)  NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     LONGTEXT,
    state           VARCHAR(30)  NOT NULL DEFAULT 'DRAFT',
    priority        VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    context_id      BIGINT       NOT NULL,
    ecr_id          BIGINT,
    assigned_to     VARCHAR(100),
    due_date        DATE,
    ai_risk_score   DOUBLE,
    ai_confidence   DOUBLE,
    ai_cost_estimate DOUBLE,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT uq_eco_number UNIQUE (context_id, eco_number),
    CONSTRAINT fk_eco_context FOREIGN KEY (context_id) REFERENCES plm_contexts(id),
    CONSTRAINT fk_eco_ecr    FOREIGN KEY (ecr_id)      REFERENCES change_requests(id),

    INDEX idx_eco_state      (state),
    INDEX idx_eco_context    (context_id),
    INDEX idx_eco_ecr        (ecr_id)
);

CREATE TABLE IF NOT EXISTS change_order_items (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    eco_id          BIGINT       NOT NULL,
    part_id         BIGINT,
    document_id     BIGINT,
    change_type     VARCHAR(30)  NOT NULL DEFAULT 'MODIFY',
    description     LONGTEXT,
    from_revision   VARCHAR(10),
    to_revision     VARCHAR(10),
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ecoi_eco  FOREIGN KEY (eco_id)      REFERENCES change_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_ecoi_part FOREIGN KEY (part_id)     REFERENCES parts(id),
    INDEX idx_ecoi_eco (eco_id)
);
