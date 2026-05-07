-- =============================================================================
-- V111  —  Seed ECRs, Change Orders, Worklist tasks, and Notifications
-- Runs exactly once (Flyway-tracked). INSERT IGNORE keeps it idempotent.
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. CHANGE REQUESTS (ECRs)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO change_requests
    (id, number, title, description, context_type, context_id, status,
     created_by, created_at, updated_at)
VALUES
    (1, 'ECR-2026-001',
     'Replace CAN FD controller with newer automotive-grade chip',
     'The current CAN FD controller (ELX-001-A) has been flagged by procurement as EOL in Q4 2026. This ECR proposes evaluating and qualifying a drop-in replacement with equivalent or better performance.',
     'PRODUCT', '1', 'SUBMITTED',
     'john.doe', NOW() - INTERVAL 14 DAY, NOW() - INTERVAL 14 DAY),

    (2, 'ECR-2026-002',
     'Update ECU housing thermal pad specification',
     'Thermal analysis shows the existing housing (ECU-001-A) runs 8°C above target at peak load. ECR to revise the thermal interface material spec and add an additional heat-spreader.',
     'PRODUCT', '1', 'UNDERREVIEW',
     'john.doe', NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 5 DAY),

    (3, 'ECR-2026-003',
     'Integrate GPS multi-constellation receiver firmware update',
     'NAV-001-A requires firmware v3.1 to support Galileo E6 band corrections. Update scope includes firmware qualification, updated ARINC 429 driver, and avionics test report addendum.',
     'LIBRARY', '2', 'APPROVED',
     'sarah.smith', NOW() - INTERVAL 20 DAY, NOW() - INTERVAL 7 DAY),

    (4, 'ECR-2026-004',
     'OTA security hardening — upgrade AES-256-GCM cipher suite',
     'Security audit identified that the OTA Update Manager (SW-002-A) uses CBC mode. This ECR mandates migration to GCM for authenticated encryption and updated key-derivation function.',
     'PRODUCT', '1', 'INWORK',
     'admin', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 1 DAY),

    (5, 'ECR-2026-005',
     'Add vibration isolation to sensor fusion mounting',
     'Endurance testing of ELX-003-B shows connector fretting failures at 200 Hz resonance. ECR proposes anti-vibration mounts and rerouted flex harness.',
     'PRODUCT', '1', 'SUBMITTED',
     'john.doe', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY);

ALTER TABLE change_requests AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 2. CHANGE TASKS (Worklist items — assignees pull from ECR approval flow)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO change_tasks
    (id, change_request_id, change_notice_id, type, decision, assignee,
     comment, decided_by, decided_at, created_at)
VALUES
    -- ECR-2026-001 needs review by sarah.smith (pending)
    (1, 1, NULL, 'REVIEW', 'PENDING', 'sarah.smith',
     NULL, NULL, NULL, NOW() - INTERVAL 13 DAY),

    -- ECR-2026-002 approved by sarah, now needs admin sign-off (pending)
    (2, 2, NULL, 'REVIEW', 'APPROVED', 'sarah.smith',
     'Hardware team validated thermal model — approved for ECO phase.',
     'sarah.smith', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 9 DAY),
    (3, 2, NULL, 'APPROVE', 'PENDING', 'admin',
     NULL, NULL, NULL, NOW() - INTERVAL 4 DAY),

    -- ECR-2026-003 fully approved
    (4, 3, NULL, 'REVIEW', 'APPROVED', 'sarah.smith',
     'Galileo firmware package reviewed — no integration issues.',
     'sarah.smith', NOW() - INTERVAL 8 DAY, NOW() - INTERVAL 18 DAY),
    (5, 3, NULL, 'APPROVE', 'APPROVED', 'admin',
     'Approved. Proceed with qualification test update.',
     'admin', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 16 DAY),

    -- ECR-2026-004 under development — needs review
    (6, 4, NULL, 'REVIEW', 'PENDING', 'john.doe',
     NULL, NULL, NULL, NOW() - INTERVAL 5 DAY),

    -- ECR-2026-005 needs initial review
    (7, 5, NULL, 'REVIEW', 'PENDING', 'sarah.smith',
     NULL, NULL, NULL, NOW() - INTERVAL 2 DAY);

ALTER TABLE change_tasks AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 3. CHANGE ORDERS (ECOs) — linked to approved / in-progress ECRs
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO change_orders
    (id, eco_number, title, description, state, priority,
     context_id, ecr_id, assigned_to, due_date,
     ai_risk_score, ai_confidence, ai_cost_estimate,
     created_by, updated_by, created_at, updated_at, is_deleted)
VALUES
    (1, 'ECO-2026-001',
     'Qualify replacement CAN FD controller',
     'Full qualification program for the replacement CAN FD chip: bench testing, HIL validation, and DV signoff.',
     'INPROGRESS', 'HIGH',
     1, 1, 'john.doe', DATE_ADD(CURDATE(), INTERVAL 30 DAY),
     0.42, 0.87, 15200.00,
     'sarah.smith', 'sarah.smith', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 1 DAY, 0),

    (2, 'ECO-2026-002',
     'ECU housing thermal interface material revision',
     'Update BOM line for thermal pad, revise torque spec on heat-spreader fasteners, and release rev B housing drawing.',
     'DRAFT', 'MEDIUM',
     1, 2, 'john.doe', DATE_ADD(CURDATE(), INTERVAL 21 DAY),
     0.28, 0.91, 4800.00,
     'admin', 'admin', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY, 0);

ALTER TABLE change_orders AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 4. CHANGE ORDER ITEMS
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO change_order_items
    (id, eco_id, part_id, document_id, change_type, description,
     from_revision, to_revision, sort_order, created_at)
VALUES
    -- ECO-2026-001 affects CAN Bus Controller part and CAN FD Protocol Spec doc
    (1, 1, 5, NULL, 'MODIFY',
     'Replace CAN FD controller IC; no form/fit/function change to board outline.',
     'A', 'B', 1, NOW() - INTERVAL 5 DAY),
    (2, 1, NULL, 3, 'MODIFY',
     'Update CAN FD Protocol Specification with new controller register map.',
     NULL, NULL, 2, NOW() - INTERVAL 5 DAY),

    -- ECO-2026-002 affects housing part and hardware design spec doc
    (3, 2, 1, NULL, 'MODIFY',
     'Revise thermal interface material from 3 W/mK to 6 W/mK pad; add heat-spreader.',
     'A', 'B', 1, NOW() - INTERVAL 3 DAY),
    (4, 2, NULL, 2, 'MODIFY',
     'Update hardware design specification with revised thermal analysis and new BOM reference.',
     NULL, NULL, 2, NOW() - INTERVAL 3 DAY);

ALTER TABLE change_order_items AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 5. NOTIFICATIONS  (user_id 1=admin, 2=john.doe, 3=sarah.smith, 4=mike.wilson)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO notifications
    (id, user_id, title, message, type,
     entity_type, entity_id, entity_number,
     is_read, created_at, read_at)
VALUES
    -- admin notifications
    (1, 1, 'ECR requires your approval',
     'ECR-2026-002 "Update ECU housing thermal pad specification" is awaiting your sign-off.',
     'ACTION_REQUIRED', 'CHANGE_REQUEST', 2, 'ECR-2026-002',
     0, NOW() - INTERVAL 4 DAY, NULL),

    (2, 1, 'ECR-2026-003 fully approved',
     'Change request ECR-2026-003 has been approved and is ready for ECO creation.',
     'INFO', 'CHANGE_REQUEST', 3, 'ECR-2026-003',
     1, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 6 DAY),

    (3, 1, 'New ECR submitted by john.doe',
     'ECR-2026-005 "Add vibration isolation to sensor fusion mounting" was submitted and requires routing.',
     'INFO', 'CHANGE_REQUEST', 5, 'ECR-2026-005',
     0, NOW() - INTERVAL 3 DAY, NULL),

    (4, 1, 'OTA security ECR in progress',
     'ECR-2026-004 cipher suite upgrade is now INWORK. Review estimate: 6 W development effort.',
     'INFO', 'CHANGE_REQUEST', 4, 'ECR-2026-004',
     0, NOW() - INTERVAL 1 DAY, NULL),

    -- john.doe notifications
    (5, 2, 'You are assigned to ECO-2026-001',
     'Change Order ECO-2026-001 "Qualify replacement CAN FD controller" has been assigned to you. Due in 30 days.',
     'ACTION_REQUIRED', 'CHANGE_ORDER', 1, 'ECO-2026-001',
     0, NOW() - INTERVAL 5 DAY, NULL),

    (6, 2, 'ECR-2026-004 needs your review',
     'ECR-2026-004 "OTA security hardening" has been submitted and requires your engineering review.',
     'ACTION_REQUIRED', 'CHANGE_REQUEST', 4, 'ECR-2026-004',
     0, NOW() - INTERVAL 5 DAY, NULL),

    (7, 2, 'Part ECU-002-A promoted to RELEASED',
     'Power Distribution Module (ECU-002-A) lifecycle state has been updated to RELEASED.',
     'INFO', 'PART', 2, 'ECU-002-A',
     1, NOW() - INTERVAL 12 DAY, NOW() - INTERVAL 11 DAY),

    -- sarah.smith notifications
    (8, 3, 'ECR-2026-001 awaiting your review',
     'ECR-2026-001 "Replace CAN FD controller" was submitted by john.doe and is waiting for your review.',
     'ACTION_REQUIRED', 'CHANGE_REQUEST', 1, 'ECR-2026-001',
     0, NOW() - INTERVAL 13 DAY, NULL),

    (9, 3, 'ECR-2026-005 awaiting your review',
     'ECR-2026-005 "Add vibration isolation to sensor fusion mounting" needs your review.',
     'ACTION_REQUIRED', 'CHANGE_REQUEST', 5, 'ECR-2026-005',
     0, NOW() - INTERVAL 2 DAY, NULL),

    (10, 3, 'Your ECR-2026-003 was fully approved',
     'The change request ECR-2026-003 you submitted has been approved by admin. Proceed with ECO.',
     'SUCCESS', 'CHANGE_REQUEST', 3, 'ECR-2026-003',
     1, NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 7 DAY),

    -- mike.wilson notifications
    (11, 4, 'New documents available for review',
     '2 documents have been updated in the ECU Platform context: HDS-ECU-002 and PROT-CAN-001.',
     'INFO', 'DOCUMENT', NULL, NULL,
     0, NOW() - INTERVAL 8 DAY, NULL),

    (12, 4, 'Part ECU-004-A is UNDERREVIEW',
     'Mounting Bracket Set (ECU-004-A) has been submitted for review. You are listed as a QA stakeholder.',
     'INFO', 'PART', 4, 'ECU-004-A',
     1, NOW() - INTERVAL 10 DAY, NOW() - INTERVAL 9 DAY);

ALTER TABLE notifications AUTO_INCREMENT = 1000;
