-- V114: Align part_documents table with PartDocument JPA entity.
-- The entity does NOT extend BaseEntity, so the only columns needed
-- are id, part_id, document_id — which already exist from V106.
-- This migration is a no-op but documents the alignment decision.

-- Verify the unique constraint exists (idempotent recreate for environments
-- where V106 may have run with a different constraint name).
-- Nothing to change — V106 already matches the PartDocument entity columns.
SELECT 1;
