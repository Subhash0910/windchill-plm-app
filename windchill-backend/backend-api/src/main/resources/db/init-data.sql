-- Initialize default admin user
-- Password: admin123 (BCrypt hashed)
-- Hash generated from: $2a$10$slYQmyNdGzin7olVN3p5Be3DlH.PKZbv5H8KnzzVgXXbVxzy990qm

INSERT IGNORE INTO users (id, username, email, full_name, password, role, created_at, updated_at) VALUES
(1, 'admin', 'admin@windchill.local', 'Administrator', '$2a$10$slYQmyNdGzin7olVN3p5Be3DlH.PKZbv5H8KnzzVgXXbVxzy990qm', 'ADMIN', NOW(), NOW());
