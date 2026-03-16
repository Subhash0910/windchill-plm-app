-- =============================================================================
-- V106  —  Normalize parts.lifecycle_state to match LifecycleStateEnum
--
-- Hibernate ddl-auto:update may have converted lifecycle_state to an ENUM
-- with the old values. We ALTER to VARCHAR first, then fix the bad data.
-- =============================================================================

-- Step 1: ensure column is plain VARCHAR so UNDER_REVIEW is accepted
ALTER TABLE parts MODIFY COLUMN lifecycle_state VARCHAR(20) NOT NULL DEFAULT 'INWORK';

-- Step 2: normalize old values to the current enum constant name
UPDATE parts SET lifecycle_state = 'UNDER_REVIEW' WHERE lifecycle_state IN ('INREVIEW', 'UNDERREVIEW');
