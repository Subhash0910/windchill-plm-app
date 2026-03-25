-- V107: Expand audit_logs.entity_type to include DOCUMENT
-- Hibernate ddl-auto:update cannot ALTER an ENUM column that has existing data
-- (it fails with 'Data truncated for column entity_type at row 8').
-- This migration does it safely: convert to VARCHAR first, then back to ENUM.

ALTER TABLE audit_logs
    MODIFY COLUMN entity_type VARCHAR(20) NOT NULL;

ALTER TABLE audit_logs
    MODIFY COLUMN entity_type ENUM('CONTEXT','FOLDER','PART','BOM_LINE','DOCUMENT') NOT NULL;
