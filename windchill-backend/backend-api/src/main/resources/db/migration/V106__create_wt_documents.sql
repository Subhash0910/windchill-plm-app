-- ============================================================
-- V106 — Phase 2: WTDocument (Document Management)
-- ============================================================

CREATE TABLE IF NOT EXISTS wt_documents (
    id              BIGINT         PRIMARY KEY AUTO_INCREMENT,
    context_id      BIGINT         NOT NULL,
    folder_id       BIGINT,
    doc_number      VARCHAR(80)    NOT NULL,
    name            VARCHAR(255)   NOT NULL,
    description     LONGTEXT,
    doc_type        VARCHAR(20)    NOT NULL DEFAULT 'SPEC',
    lifecycle_state VARCHAR(20)    NOT NULL DEFAULT 'INWORK',
    revision        VARCHAR(10)    NOT NULL DEFAULT 'A',
    iteration       INT            NOT NULL DEFAULT 1,
    is_latest       BOOLEAN        NOT NULL DEFAULT TRUE,
    master_id       BIGINT,
    checked_out_by  VARCHAR(100),
    file_name       VARCHAR(512),
    file_size       BIGINT,
    mime_type       VARCHAR(120),
    storage_path    VARCHAR(1024),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN        NOT NULL DEFAULT FALSE,
    version         BIGINT         DEFAULT 0,

    CONSTRAINT uq_doc_ctx_number_rev_iter
        UNIQUE (context_id, doc_number, revision, iteration),

    CONSTRAINT fk_doc_context
        FOREIGN KEY (context_id) REFERENCES plm_contexts(id),
    CONSTRAINT fk_doc_folder
        FOREIGN KEY (folder_id)  REFERENCES folders(id),

    INDEX idx_doc_context    (context_id),
    INDEX idx_doc_folder     (folder_id),
    INDEX idx_doc_master     (master_id),
    INDEX idx_doc_state      (lifecycle_state),
    INDEX idx_doc_type       (doc_type),
    INDEX idx_doc_latest     (is_latest)
);

-- ---- Part ↔ Document relationship --------------------------------
CREATE TABLE IF NOT EXISTS part_documents (
    id          BIGINT  PRIMARY KEY AUTO_INCREMENT,
    part_id     BIGINT  NOT NULL,
    document_id BIGINT  NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partdoc_part FOREIGN KEY (part_id)     REFERENCES parts(id) ON DELETE CASCADE,
    CONSTRAINT fk_partdoc_doc  FOREIGN KEY (document_id) REFERENCES wt_documents(id) ON DELETE CASCADE,
    CONSTRAINT uq_partdoc      UNIQUE (part_id, document_id),
    INDEX idx_partdoc_part (part_id),
    INDEX idx_partdoc_doc  (document_id)
);

-- ---- Demo seed data -----------------------------------------------
INSERT INTO wt_documents
  (context_id, doc_number, name, description, doc_type, lifecycle_state, revision, iteration, is_latest, created_by)
VALUES
  (1, 'SPEC-001', 'ECU Hardware Specification',   'Top-level hardware requirements for ECU module', 'SPEC',      'RELEASED',  'A', 1, TRUE, 'admin'),
  (1, 'DRW-001',  'ECU PCB Layout Drawing',        'PCB Gerber and assembly drawing for ECU rev A',  'DRAWING',   'RELEASED',  'A', 1, TRUE, 'admin'),
  (1, 'PROC-001', 'Assembly Procedure — ECU',      'Step-by-step board assembly and test procedure', 'PROCEDURE', 'UNDERREVIEW','A', 1, TRUE, 'admin'),
  (1, 'RPT-001',  'DVT Report — ECU Phase 1',     'Design verification test results Q1 2026',       'REPORT',    'RELEASED',  'A', 1, TRUE, 'admin'),
  (1, 'SPEC-002', 'BMS Battery Management Spec',   'Electrical and thermal requirements for BMS',    'SPEC',      'INWORK',    'A', 1, TRUE, 'admin'),
  (1, 'DRW-002',  'BMS Enclosure Drawing',         'Sheet-metal enclosure DXF for BMS assembly',     'DRAWING',   'INWORK',    'A', 1, TRUE, 'admin');

-- Link first two docs to part id=1 (seed part from V105)
INSERT IGNORE INTO part_documents (part_id, document_id)
SELECT 1, id FROM wt_documents WHERE doc_number IN ('SPEC-001','DRW-001');
