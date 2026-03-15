-- =============================================================================
-- V106  —  Normalize parts.lifecycle_state values to match LifecycleStateEnum
--
-- V105 seed data inserted 'INREVIEW' but the Java enum uses 'UNDER_REVIEW'.
-- Only the parts table maps to LifecycleStateEnum via @Enumerated(STRING).
-- =============================================================================

UPDATE parts SET lifecycle_state = 'UNDER_REVIEW' WHERE lifecycle_state IN ('INREVIEW', 'UNDERREVIEW');
