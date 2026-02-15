-- Windchill-like PLM core spine: contexts, folders, parts, BOM and audit logs

CREATE TABLE IF NOT EXISTS plm_contexts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    context_type VARCHAR(20) NOT NULL,
    description LONGTEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_ctx_code (code),
    INDEX idx_ctx_type (context_type)
);

CREATE TABLE IF NOT EXISTS folders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    context_id BIGINT NOT NULL,
    parent_id BIGINT,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(1024) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    CONSTRAINT uq_folder_context_path UNIQUE (context_id, path),
    INDEX idx_folder_context (context_id),
    INDEX idx_folder_parent (parent_id),
    INDEX idx_folder_path (path),
    CONSTRAINT fk_folder_context FOREIGN KEY (context_id) REFERENCES plm_contexts(id)
);

CREATE TABLE IF NOT EXISTS parts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    master_id BIGINT,
    context_id BIGINT NOT NULL,
    folder_id BIGINT,
    part_number VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description LONGTEXT,
    lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'INWORK',
    revision VARCHAR(10) NOT NULL DEFAULT 'A',
    iteration INT NOT NULL DEFAULT 1,
    is_latest BOOLEAN NOT NULL DEFAULT true,
    checked_out_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    CONSTRAINT uq_part_ctx_number_rev_iter UNIQUE (context_id, part_number, revision, iteration),
    INDEX idx_part_context (context_id),
    INDEX idx_part_master (master_id),
    INDEX idx_part_folder (folder_id),
    INDEX idx_part_state (lifecycle_state),
    INDEX idx_part_latest (is_latest),
    CONSTRAINT fk_part_context FOREIGN KEY (context_id) REFERENCES plm_contexts(id),
    CONSTRAINT fk_part_folder FOREIGN KEY (folder_id) REFERENCES folders(id)
);

CREATE TABLE IF NOT EXISTS bom_lines (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    parent_part_id BIGINT NOT NULL,
    child_part_id BIGINT NOT NULL,
    quantity DECIMAL(18,6) NOT NULL DEFAULT 1,
    unit VARCHAR(10) NOT NULL DEFAULT 'EA',
    find_number VARCHAR(30),
    line_note VARCHAR(500),
    sort_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_bom_parent (parent_part_id),
    INDEX idx_bom_child (child_part_id),
    CONSTRAINT fk_bom_parent FOREIGN KEY (parent_part_id) REFERENCES parts(id),
    CONSTRAINT fk_bom_child FOREIGN KEY (child_part_id) REFERENCES parts(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(80) NOT NULL,
    actor VARCHAR(100),
    details LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_created (created_at)
);
