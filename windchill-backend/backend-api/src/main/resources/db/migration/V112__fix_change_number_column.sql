-- =============================================================================
-- V112  —  Ensure change_number column exists and populate V111 seed rows
--
-- Background: V100 created change_requests with a `number` column.
--             The entity maps to `change_number` (Hibernate ddl-auto:update
--             adds this on first boot). V111 seeded into `number` so
--             change_number is NULL. This migration owns the column in Flyway
--             and fixes the seed data.
-- =============================================================================

-- Add the canonical column (IF NOT EXISTS avoids error on databases where
-- Hibernate ddl-auto:update already added it)
ALTER TABLE change_requests
    ADD COLUMN IF NOT EXISTS change_number VARCHAR(30) NULL AFTER id;

-- Copy legacy number → change_number for any rows missing it
UPDATE change_requests
SET    change_number = `number`
WHERE  change_number IS NULL AND `number` IS NOT NULL;

-- Patch the 5 V111 seed rows explicitly (idempotent)
UPDATE change_requests SET change_number = 'ECR-2026-001' WHERE id = 1 AND (change_number IS NULL OR change_number = '');
UPDATE change_requests SET change_number = 'ECR-2026-002' WHERE id = 2 AND (change_number IS NULL OR change_number = '');
UPDATE change_requests SET change_number = 'ECR-2026-003' WHERE id = 3 AND (change_number IS NULL OR change_number = '');
UPDATE change_requests SET change_number = 'ECR-2026-004' WHERE id = 4 AND (change_number IS NULL OR change_number = '');
UPDATE change_requests SET change_number = 'ECR-2026-005' WHERE id = 5 AND (change_number IS NULL OR change_number = '');
