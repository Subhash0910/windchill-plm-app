-- =============================================================================
-- V106  —  Normalize lifecycle_state values to match LifecycleStateEnum
--
-- V105 seed data inserted 'INREVIEW' but the Java enum uses 'UNDER_REVIEW'.
-- This migration fixes all affected rows so Hibernate can deserialise them.
-- =============================================================================

-- Fix parts table
UPDATE parts SET lifecycle_state = 'UNDER_REVIEW' WHERE lifecycle_state = 'INREVIEW';
UPDATE parts SET lifecycle_state = 'UNDER_REVIEW' WHERE lifecycle_state = 'UNDERREVIEW';

-- Fix products table (uses same lifecycle_state column)
UPDATE products SET lifecycle_state = 'UNDER_REVIEW' WHERE lifecycle_state = 'INREVIEW';
UPDATE products SET lifecycle_state = 'UNDER_REVIEW' WHERE lifecycle_state = 'UNDERREVIEW';

-- Fix documents table (uses status column, not lifecycle_state, but normalise just in case)
UPDATE documents SET status = 'UNDER_REVIEW' WHERE status = 'INREVIEW';
UPDATE documents SET status = 'UNDER_REVIEW' WHERE status = 'UNDERREVIEW';
