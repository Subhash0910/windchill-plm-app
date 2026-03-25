-- V107: Expand audit_logs.entity_type to include DOCUMENT
-- Root causes found in V105 seed data:
--   row 7: entity_type = 'DOCUMENT' -- valid once we add it to enum
--   row 8: entity_type = 'USER'     -- NOT a PLM entity type, must be remapped
--
-- Strategy (safe 3-step approach for MySQL):
--   Step 1: Fix the bad value so no row has an out-of-enum string
--   Step 2: MODIFY to VARCHAR (always succeeds regardless of current values)
--   Step 3: MODIFY back to ENUM with the expanded set

-- Step 1: Remap 'USER' audit log entry to a valid type
--   Row 8 is a LOGIN event; treat it as a CONTEXT-level system event
UPDATE audit_logs SET entity_type = 'CONTEXT' WHERE id = 8 AND entity_type = 'USER';

-- Step 2: Relax the column to VARCHAR so any current value is valid
ALTER TABLE audit_logs
    MODIFY COLUMN entity_type VARCHAR(20) NOT NULL;

-- Step 3: Re-apply the ENUM with DOCUMENT included
--   All rows now have values only in this set: CONTEXT, FOLDER, PART, BOM_LINE, DOCUMENT
ALTER TABLE audit_logs
    MODIFY COLUMN entity_type ENUM('CONTEXT','FOLDER','PART','BOM_LINE','DOCUMENT') NOT NULL;
