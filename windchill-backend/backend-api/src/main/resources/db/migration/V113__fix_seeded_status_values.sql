-- =============================================================================
-- V113  —  Fix invalid status/state values inserted by V111
--
-- Problem: V111 used status strings that don't match the Java enum names:
--   change_requests:  'UNDERREVIEW' → 'IN_REVIEW'
--                     'INWORK'      → 'DRAFT'
--   change_orders:    'INPROGRESS'  → 'IMPLEMENTING'
--
-- These mismatches cause JPA EnumType.STRING deserialization to fail,
-- returning null status on affected rows.
-- =============================================================================

-- Fix change_requests status values
UPDATE change_requests SET status = 'IN_REVIEW' WHERE status = 'UNDERREVIEW';
UPDATE change_requests SET status = 'DRAFT'     WHERE status = 'INWORK';

-- Fix change_orders state values
UPDATE change_orders SET state = 'IMPLEMENTING' WHERE state = 'INPROGRESS';
