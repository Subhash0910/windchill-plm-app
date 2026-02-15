-- Context membership + roles (Windchill-like Team/ACL foundation)

CREATE TABLE IF NOT EXISTS plm_context_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    context_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT false,
    version BIGINT DEFAULT 0,

    CONSTRAINT uq_ctx_member UNIQUE (context_id, user_id),
    INDEX idx_ctx_member_context (context_id),
    INDEX idx_ctx_member_user (user_id),
    CONSTRAINT fk_ctx_member_context FOREIGN KEY (context_id) REFERENCES plm_contexts(id),
    CONSTRAINT fk_ctx_member_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Bootstrap: add default 'admin' user as ADMIN member to all existing contexts (dev-friendly)
INSERT INTO plm_context_members (context_id, user_id, role, created_at, updated_at, is_deleted, version)
SELECT c.id, u.id, 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, 0
FROM plm_contexts c
JOIN users u ON u.username = 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM plm_context_members m WHERE m.context_id = c.id AND m.user_id = u.id
);
