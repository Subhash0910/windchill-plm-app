-- =============================================================================
-- V106  —  Fix enum data mismatches (data cleanup)
--
-- Root cause: V105 seed data used old/invalid enum values that no longer
-- exist in the Java enums, causing:
--   1. Hibernate DDL errors at startup (alter table enum modify fails)
--   2. Runtime crash: "No enum constant LifecycleStateEnum.INREVIEW"
--      when loading /api/v1/plm/parts
--
-- Fixes applied:
--   A. parts.lifecycle_state: INREVIEW → UNDERREVIEW
--   B. audit_logs.entity_type: PROJECT/DOCUMENT/USER → CONTEXT
--      (PlmEntityTypeEnum only allows: CONTEXT, FOLDER, PART, BOM_LINE)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- A. Fix parts.lifecycle_state — INREVIEW is not a valid LifecycleStateEnum
--    Valid values: INWORK, UNDERREVIEW, RELEASED, OBSOLETE
-- ----------------------------------------------------------------------------
UPDATE parts
SET lifecycle_state = 'UNDERREVIEW'
WHERE lifecycle_state = 'INREVIEW';

-- ----------------------------------------------------------------------------
-- B. Fix audit_logs.entity_type — PROJECT, DOCUMENT, USER are not valid
--    PlmEntityTypeEnum values.
--    Valid values: CONTEXT, FOLDER, PART, BOM_LINE
-- ----------------------------------------------------------------------------
UPDATE audit_logs
SET entity_type = 'CONTEXT'
WHERE entity_type = 'PROJECT';

UPDATE audit_logs
SET entity_type = 'PART'
WHERE entity_type = 'DOCUMENT';

UPDATE audit_logs
SET entity_type = 'PART'
WHERE entity_type = 'USER';

-- Catch-all: any other rogue values not in the allowed set
UPDATE audit_logs
SET entity_type = 'PART'
WHERE entity_type NOT IN ('CONTEXT', 'FOLDER', 'PART', 'BOM_LINE');
