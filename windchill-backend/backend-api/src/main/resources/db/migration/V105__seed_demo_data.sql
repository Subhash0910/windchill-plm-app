-- =============================================================================
-- V105  —  Demo seed data for Windchill PLM
-- Runs exactly once (Flyway-tracked). INSERT IGNORE keeps it idempotent.
--
-- Demo accounts (all passwords = admin123):
--   admin        — ADMIN    (already exists from V1, INSERT IGNORE skips it)
--   john.doe     — ENGINEER
--   sarah.smith  — MANAGER
--   mike.wilson  — VIEWER
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1. USERS  (same BCrypt hash as V1 admin = password "admin123")
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO users
    (id, username, email, first_name, last_name, password_hash,
     role, is_active, is_email_verified, department,
     created_at, updated_at, version)
VALUES
    (1, 'admin',       'admin@windchill.local',              'System', 'Administrator',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/f0G',
     'ADMIN',   1, 1, 'IT Operations',          NOW(), NOW(), 0),
    (2, 'john.doe',    'john.doe@windchill-plm.com',         'John',   'Doe',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/f0G',
     'ENGINEER',1, 1, 'Mechanical Engineering', NOW(), NOW(), 0),
    (3, 'sarah.smith', 'sarah.smith@windchill-plm.com',      'Sarah',  'Smith',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/f0G',
     'MANAGER', 1, 1, 'Product Management',     NOW(), NOW(), 0),
    (4, 'mike.wilson', 'mike.wilson@windchill-plm.com',      'Mike',   'Wilson',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/f0G',
     'VIEWER',  1, 1, 'Quality Assurance',      NOW(), NOW(), 0);

ALTER TABLE users AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 2. PROJECTS  (insert before products/documents because they FK to projects)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO projects
    (id, project_code, project_name, description, status,
     manager_id, start_date, end_date, department, priority,
     progress_percentage, is_confidential,
     created_at, updated_at, created_by, version)
VALUES
    (1, 'PROJ-ECU-003', 'ECU Gen-3 Development',
     'Full development program for third generation ECU platform — hardware, software and validation',
     'IN_PROGRESS', 3, '2025-01-15', '2026-06-30', 'Automotive Engineering', 'HIGH', 65, 0,
     NOW(), NOW(), 'admin', 0),
    (2, 'PROJ-AVI-002', 'Avionics MK-II Certification',
     'DO-178C DAL-A and DO-254 DAL-A certification program for mission-critical avionics suite',
     'IN_PROGRESS', 1, '2025-03-01', '2026-12-31', 'Defense Engineering', 'CRITICAL', 40, 1,
     NOW(), NOW(), 'admin', 0),
    (3, 'PROJ-OTA-001', 'OTA Platform MVP',
     'Minimum viable product milestone for the secure over-the-air firmware update infrastructure',
     'IN_PROGRESS', 3, '2026-01-01', '2026-09-30', 'Connected Vehicles', 'MEDIUM', 25, 0,
     NOW(), NOW(), 'admin', 0);

ALTER TABLE projects AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO products
    (id, product_code, product_name, description, status,
     version_number, category, manufacturer, owner_id, project_id,
     maturity_level, lifecycle_state,
     created_at, updated_at, created_by, version)
VALUES
    (1, 'PROD-ECU-003', 'Windchill ECU Gen-3',
     'Third generation engine control unit platform for Level-3 autonomous vehicles',
     'ACTIVE', '3.0.0', 'Automotive ECU', 'Windchill Corp', 1, 1,
     'PRODUCTION', 'RELEASED', NOW(), NOW(), 'admin', 0),
    (2, 'PROD-AVI-MK2', 'Avionics Suite MK-II',
     'Mark II mission avionics suite, fully DO-178C / DO-254 certified',
     'ACTIVE', '2.1.0', 'Avionics', 'Windchill Corp', 1, 2,
     'PRODUCTION', 'RELEASED', NOW(), NOW(), 'admin', 0),
    (3, 'PROD-OTA-001', 'OTA Platform v1',
     'Secure over-the-air update platform for connected and autonomous vehicles',
     'DRAFT', '1.0.0', 'Software Platform', 'Windchill Corp', 1, 3,
     'DEVELOPMENT', 'INWORK', NOW(), NOW(), 'admin', 0);

ALTER TABLE products AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 4. DOCUMENTS
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO documents
    (id, document_number, title, description,
     document_type, status, version_number,
     owner_id, project_id, approval_status,
     created_at, updated_at, created_by, version)
VALUES
    (1, 'SRS-ECU-001', 'ECU Gen-3 System Requirements Specification',
     'Complete SRS for the ECU Gen-3 platform — functional, performance and safety requirements',
     'REQUIREMENT', 'RELEASED', '1.2', 1, 1, 'APPROVED', NOW(), NOW(), 'admin', 0),
    (2, 'HDS-ECU-002', 'ECU Hardware Design Specification',
     'Detailed hardware design including schematics, PCB stack-up and component selection rationale',
     'DESIGN', 'INREVIEW', '0.9', 2, 1, 'PENDING', NOW(), NOW(), 'john.doe', 0),
    (3, 'PROT-CAN-001', 'CAN FD Protocol Specification',
     'CAN FD protocol specification, message matrix and timing analysis for the ECU platform',
     'SPECIFICATION', 'RELEASED', '2.0', 2, 1, 'APPROVED', NOW(), NOW(), 'john.doe', 0),
    (4, 'TR-AVI-001', 'Avionics MK-II Qualification Test Report',
     'Comprehensive environmental, EMC and functional test report for the MK-II avionics suite',
     'REPORT', 'RELEASED', '1.0', 3, 2, 'APPROVED', NOW(), NOW(), 'sarah.smith', 0),
    (5, 'SEC-OTA-001', 'OTA Security Architecture Document',
     'Threat model, security controls and cryptographic design for the OTA update system',
     'ARCHITECTURE', 'INWORK', '0.3', 1, 3, 'PENDING', NOW(), NOW(), 'admin', 0);

ALTER TABLE documents AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 5. PLM CONTEXTS
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO plm_contexts
    (id, code, name, context_type, description, is_active,
     created_at, updated_at, created_by, version)
VALUES
    (1, 'ECU-PLATFORM', 'Automotive ECU Platform',
     'PRODUCT',
     'Electronic Control Unit development platform for next-gen autonomous vehicles',
     1, NOW(), NOW(), 'admin', 0),
    (2, 'DEF-AVIONICS', 'Defense Avionics Suite',
     'LIBRARY',
     'Mission-critical avionics systems for defense and aerospace applications',
     1, NOW(), NOW(), 'admin', 0);

ALTER TABLE plm_contexts AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 6. FOLDERS  (path is NOT NULL; parent_id not parent_folder_id)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO folders
    (id, context_id, parent_id, name, path,
     created_at, updated_at, created_by, version)
VALUES
    (1, 1, NULL, 'Mechanical Components', '/Mechanical Components',  NOW(), NOW(), 'admin', 0),
    (2, 1, NULL, 'Electronic Systems',    '/Electronic Systems',     NOW(), NOW(), 'admin', 0),
    (3, 1, NULL, 'Software Modules',      '/Software Modules',       NOW(), NOW(), 'admin', 0),
    (4, 2, NULL, 'Avionics Hardware',     '/Avionics Hardware',      NOW(), NOW(), 'admin', 0),
    (5, 2, NULL, 'Navigation Systems',    '/Navigation Systems',     NOW(), NOW(), 'admin', 0);

ALTER TABLE folders AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 7. PARTS
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO parts
    (id, master_id, context_id, folder_id, part_number, name, description,
     lifecycle_state, revision, iteration, is_latest,
     created_at, updated_at, created_by, version)
VALUES
    -- Context 1 — Mechanical folder
    ( 1, 1,1,1,'ECU-001-A','Engine Control Unit Housing',
      'Aluminum housing for main ECU with integrated thermal management fins',
      'RELEASED','A',1,1, NOW(),NOW(),'admin',0),
    ( 2, 2,1,1,'ECU-002-A','Power Distribution Module',
      'High-density PCB for power distribution, 150 A continuous, 200 A peak',
      'RELEASED','A',1,1, NOW(),NOW(),'john.doe',0),
    ( 3, 3,1,1,'ECU-003-A','Cooling Fan Assembly',
      'Variable-speed brushless cooling fan, 12 V DC, 2000–5000 RPM',
      'INWORK','A',1,1,  NOW(),NOW(),'john.doe',0),
    ( 4, 4,1,1,'ECU-004-A','Mounting Bracket Set',
      'Stainless-steel M8 mounting bracket set, 4-bolt pattern, vibration-damped',
      'INREVIEW','A',1,1, NOW(),NOW(),'john.doe',0),
    -- Context 1 — Electronic Systems folder
    ( 5, 5,1,2,'ELX-001-A','CAN Bus Controller',
      'Automotive-grade CAN FD controller, ISO 11898-2, 5 Mbps capable',
      'RELEASED','A',1,1, NOW(),NOW(),'john.doe',0),
    ( 6, 6,1,2,'ELX-002-A','LIDAR Interface Board',
      'High-speed LIDAR data-acquisition PCB, 100 Mbps Ethernet interface',
      'INWORK','A',1,1,  NOW(),NOW(),'john.doe',0),
    ( 7, 7,1,2,'ELX-003-B','Sensor Fusion Unit',
      'Multi-sensor data-fusion processor Rev B — improved latency and accuracy',
      'INREVIEW','B',2,1, NOW(),NOW(),'john.doe',0),
    -- Context 1 — Software Modules folder
    ( 8, 8,1,3,'SW-001-A','AUTOSAR BSW Stack',
      'Base Software stack compliant with AUTOSAR Classic 4.4',
      'RELEASED','A',1,1, NOW(),NOW(),'admin',0),
    ( 9, 9,1,3,'SW-002-A','OTA Update Manager',
      'Over-the-air firmware update manager, AES-256 encrypted delta patches',
      'INWORK','A',1,1,  NOW(),NOW(),'admin',0),
    -- Context 2 — Avionics Hardware folder
    (10,10,2,4,'AVI-001-A','Flight Management Computer',
      'DO-178C DAL-A certified FMC, triple-redundant hot-standby architecture',
      'RELEASED','A',1,1, NOW(),NOW(),'admin',0),
    (11,11,2,4,'AVI-002-A','Inertial Navigation Unit',
      'Ring-laser gyroscope INU, MIL-STD-810G qualified, 0.001 deg/h drift',
      'RELEASED','A',1,1, NOW(),NOW(),'admin',0),
    -- Context 2 — Navigation Systems folder
    (12,12,2,5,'NAV-001-A','GPS Receiver Module',
      'Multi-constellation GPS/GLONASS/Galileo receiver, ARINC 429 output',
      'INREVIEW','A',1,1, NOW(),NOW(),'sarah.smith',0);

ALTER TABLE parts AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 8. BOM LINES  (table = bom_lines; column = find_number NOT reference_designator)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO bom_lines
    (id, parent_part_id, child_part_id, quantity, unit, find_number,
     created_at, updated_at, created_by, version)
VALUES
    -- ECU housing assembly
    (1, 1, 2, 1,   'EA', 'PDM-1',  NOW(), NOW(), 'admin', 0),
    (2, 1, 3, 2,   'EA', 'FAN-1',  NOW(), NOW(), 'admin', 0),
    (3, 1, 4, 4,   'EA', 'BKT-1',  NOW(), NOW(), 'admin', 0),
    -- CAN Bus controller board
    (4, 5, 6, 1,   'EA', 'LDR-1',  NOW(), NOW(), 'admin', 0),
    (5, 5, 7, 1,   'EA', 'SFU-1',  NOW(), NOW(), 'admin', 0),
    -- Flight Management Computer (triple-redundant INU)
    (6,10,11, 3,   'EA', 'INU-1',  NOW(), NOW(), 'admin', 0),
    (7,10,12, 1,   'EA', 'GPS-1',  NOW(), NOW(), 'admin', 0);

ALTER TABLE bom_lines AUTO_INCREMENT = 1000;

-- ----------------------------------------------------------------------------
-- 9. AUDIT LOGS  (table = audit_logs; columns: entity_type, entity_id, action, actor, details)
-- ----------------------------------------------------------------------------
INSERT IGNORE INTO audit_logs
    (id, entity_type, entity_id, action, actor, details,
     created_at, updated_at, version)
VALUES
    (1,'PART',  1,'CREATE',  'admin',     'Created ECU-001-A Engine Control Unit Housing', NOW(),NOW(),0),
    (2,'PART',  2,'CREATE',  'john.doe',  'Created ECU-002-A Power Distribution Module',   NOW(),NOW(),0),
    (3,'PART',  1,'PROMOTE', 'admin',     'Promoted ECU-001-A: INWORK → RELEASED',         NOW(),NOW(),0),
    (4,'PART',  2,'PROMOTE', 'john.doe',  'Promoted ECU-002-A: INWORK → RELEASED',         NOW(),NOW(),0),
    (5,'PART', 10,'PROMOTE', 'admin',     'Promoted AVI-001-A: INWORK → RELEASED',         NOW(),NOW(),0),
    (6,'PROJECT',1,'CREATE', 'admin',     'Created project PROJ-ECU-003',                  NOW(),NOW(),0),
    (7,'DOCUMENT',3,'CREATE','john.doe',  'Created CAN FD Protocol Specification',         NOW(),NOW(),0),
    (8,'USER',  1,'LOGIN',   'admin',     'Administrator logged in',                       NOW(),NOW(),0);

ALTER TABLE audit_logs AUTO_INCREMENT = 1000;
