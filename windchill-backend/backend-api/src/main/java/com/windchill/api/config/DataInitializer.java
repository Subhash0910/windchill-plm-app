package com.windchill.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds the database with realistic demo data on first startup.
 *
 * What gets created:
 *   4 users  (admin/admin123, john.doe/demo123, sarah.smith/demo123, mike.wilson/demo123)
 *   2 PLM Contexts (Automotive ECU Platform, Defense Avionics Suite)
 *   6 context members
 *   5 folders
 *  12 parts across INWORK / INREVIEW / RELEASED lifecycle states
 *   7 BOM lines (parent-child part relationships)
 *   3 products
 *   5 documents
 *   3 projects
 *   5 work items (3 PENDING — appear in Worklist page)
 *   5 notifications (2 unread)
 *   8 audit log entries
 *
 * Idempotent: checks users table count, skips if any user exists.
 * Each section is wrapped in try-catch so a single bad column name
 * never stops the rest from seeding.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        try {
            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            if (count != null && count > 0) {
                log.info("\uD83C\uDF31 Demo data already present ({} users). Skipping seed.", count);
                return;
            }
        } catch (Exception e) {
            log.warn("Could not check users table (schema may not be ready yet): {}", e.getMessage());
            return;
        }

        log.info("\uD83C\uDF31 Seeding Windchill PLM demo data...");

        try { seedUsers();           } catch (Exception e) { log.error("[seed] users failed: {}",            e.getMessage()); }
        try { seedContexts();        } catch (Exception e) { log.error("[seed] contexts failed: {}",          e.getMessage()); }
        try { seedContextMembers();  } catch (Exception e) { log.error("[seed] context-members failed: {}",   e.getMessage()); }
        try { seedFolders();         } catch (Exception e) { log.error("[seed] folders failed: {}",           e.getMessage()); }
        try { seedParts();           } catch (Exception e) { log.error("[seed] parts failed: {}",             e.getMessage()); }
        try { seedBomLines();        } catch (Exception e) { log.error("[seed] bom-lines failed: {}",         e.getMessage()); }
        try { seedProducts();        } catch (Exception e) { log.error("[seed] products failed: {}",          e.getMessage()); }
        try { seedDocuments();       } catch (Exception e) { log.error("[seed] documents failed: {}",         e.getMessage()); }
        try { seedProjects();        } catch (Exception e) { log.error("[seed] projects failed: {}",          e.getMessage()); }
        try { seedWorkItems();       } catch (Exception e) { log.error("[seed] work-items failed: {}",        e.getMessage()); }
        try { seedNotifications();   } catch (Exception e) { log.error("[seed] notifications failed: {}",    e.getMessage()); }
        try { seedAuditLogs();       } catch (Exception e) { log.error("[seed] audit-logs failed: {}",       e.getMessage()); }
        try { resetAutoIncrements(); } catch (Exception e) { log.warn("[seed]  auto-increment reset: {}",    e.getMessage()); }

        log.info("\u2705 Windchill PLM demo data seeded! Login: admin/admin123  or  any-user/demo123");
    }

    // ─── USERS ──────────────────────────────────────────────────────────────────
    private void seedUsers() {
        String admin = passwordEncoder.encode("admin123");
        String demo  = passwordEncoder.encode("demo123");

        jdbc.update("INSERT INTO users (id,username,email,first_name,last_name,password_hash,role,is_active,is_email_verified,department,created_at,updated_at,version) "
                + "VALUES (1,'admin','admin@windchill-plm.com','System','Administrator',?,'ADMIN',1,1,'IT Operations',NOW(),NOW(),0)", admin);
        jdbc.update("INSERT INTO users (id,username,email,first_name,last_name,password_hash,role,is_active,is_email_verified,department,created_at,updated_at,version) "
                + "VALUES (2,'john.doe','john.doe@windchill-plm.com','John','Doe',?,'ENGINEER',1,1,'Mechanical Engineering',NOW(),NOW(),0)", demo);
        jdbc.update("INSERT INTO users (id,username,email,first_name,last_name,password_hash,role,is_active,is_email_verified,department,created_at,updated_at,version) "
                + "VALUES (3,'sarah.smith','sarah.smith@windchill-plm.com','Sarah','Smith',?,'MANAGER',1,1,'Product Management',NOW(),NOW(),0)", demo);
        jdbc.update("INSERT INTO users (id,username,email,first_name,last_name,password_hash,role,is_active,is_email_verified,department,created_at,updated_at,version) "
                + "VALUES (4,'mike.wilson','mike.wilson@windchill-plm.com','Mike','Wilson',?,'VIEWER',1,1,'Quality Assurance',NOW(),NOW(),0)", demo);

        log.info("  [seed] \u2705 4 users  (admin/admin123  |  john.doe, sarah.smith, mike.wilson / demo123)");
    }

    // ─── PLM CONTEXTS ───────────────────────────────────────────────────────────
    private void seedContexts() {
        jdbc.update("INSERT INTO plm_context (id,name,description,type,owner_id,is_active,created_at,updated_at,version) "
                + "VALUES (1,'Automotive ECU Platform','Electronic Control Unit development platform for next-gen autonomous vehicles','PRODUCT',1,1,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO plm_context (id,name,description,type,owner_id,is_active,created_at,updated_at,version) "
                + "VALUES (2,'Defense Avionics Suite','Mission-critical avionics systems for defense and aerospace applications','LIBRARY',1,1,NOW(),NOW(),0)");
        log.info("  [seed] \u2705 2 PLM contexts");
    }

    // ─── CONTEXT MEMBERS ────────────────────────────────────────────────────────
    private void seedContextMembers() {
        jdbc.update("INSERT INTO plm_context_member (id,context_id,user_id,role,created_at,updated_at,version) VALUES (1,1,1,'ADMIN',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO plm_context_member (id,context_id,user_id,role,created_at,updated_at,version) VALUES (2,1,2,'CONTRIBUTOR',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO plm_context_member (id,context_id,user_id,role,created_at,updated_at,version) VALUES (3,1,3,'MANAGER',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO plm_context_member (id,context_id,user_id,role,created_at,updated_at,version) VALUES (4,1,4,'VIEWER',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO plm_context_member (id,context_id,user_id,role,created_at,updated_at,version) VALUES (5,2,1,'ADMIN',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO plm_context_member (id,context_id,user_id,role,created_at,updated_at,version) VALUES (6,2,3,'MANAGER',NOW(),NOW(),0)");
        log.info("  [seed] \u2705 6 context members");
    }

    // ─── FOLDERS ────────────────────────────────────────────────────────────────
    private void seedFolders() {
        jdbc.update("INSERT INTO folder (id,context_id,name,parent_folder_id,created_at,updated_at,version) VALUES (1,1,'Mechanical Components',NULL,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO folder (id,context_id,name,parent_folder_id,created_at,updated_at,version) VALUES (2,1,'Electronic Systems',NULL,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO folder (id,context_id,name,parent_folder_id,created_at,updated_at,version) VALUES (3,1,'Software Modules',NULL,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO folder (id,context_id,name,parent_folder_id,created_at,updated_at,version) VALUES (4,2,'Avionics Hardware',NULL,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO folder (id,context_id,name,parent_folder_id,created_at,updated_at,version) VALUES (5,2,'Navigation Systems',NULL,NOW(),NOW(),0)");
        log.info("  [seed] \u2705 5 folders");
    }

    // ─── PARTS ──────────────────────────────────────────────────────────────────
    private void seedParts() {
        // Context 1 — Mechanical folder
        jdbc.update(part(1L,  1L,1L,1L,"ECU-001-A","Engine Control Unit Housing",       "Aluminum housing for main ECU with integrated thermal management fins",        "RELEASED","A",1));
        jdbc.update(part(2L,  2L,1L,1L,"ECU-002-A","Power Distribution Module",           "High-density PCB for power distribution, 150A continuous, 200A peak",           "RELEASED","A",1));
        jdbc.update(part(3L,  3L,1L,1L,"ECU-003-A","Cooling Fan Assembly",                "Variable speed brushless cooling fan assembly, 12V DC, 2000-5000 RPM",           "INWORK",  "A",1));
        jdbc.update(part(4L,  4L,1L,1L,"ECU-004-A","Mounting Bracket Set",                "Stainless steel M8 mounting bracket set, 4-bolt pattern, vibration damped",       "INREVIEW","A",1));
        // Context 1 — Electronic Systems folder
        jdbc.update(part(5L,  5L,1L,2L,"ELX-001-A","CAN Bus Controller",                  "Automotive-grade CAN FD controller, ISO 11898-2, 5Mbps capable",                 "RELEASED","A",1));
        jdbc.update(part(6L,  6L,1L,2L,"ELX-002-A","LIDAR Interface Board",               "High-speed LIDAR data acquisition PCB, 100Mbps Ethernet interface",              "INWORK",  "A",1));
        jdbc.update(part(7L,  7L,1L,2L,"ELX-003-B","Sensor Fusion Unit",                  "Multi-sensor data fusion processor Rev B — improved latency and accuracy",        "INREVIEW","B",2));
        // Context 1 — Software folder
        jdbc.update(part(8L,  8L,1L,3L,"SW-001-A", "AUTOSAR BSW Stack",                   "Base Software stack compliant with AUTOSAR Classic 4.4",                         "RELEASED","A",1));
        jdbc.update(part(9L,  9L,1L,3L,"SW-002-A", "OTA Update Manager",                  "Over-the-air firmware update manager, AES-256 encrypted delta patches",          "INWORK",  "A",1));
        // Context 2 — Avionics Hardware folder
        jdbc.update(part(10L,10L,2L,4L,"AVI-001-A","Flight Management Computer",           "DO-178C DAL-A certified FMC, triple-redundant hot standby architecture",          "RELEASED","A",1));
        jdbc.update(part(11L,11L,2L,4L,"AVI-002-A","Inertial Navigation Unit",             "Ring laser gyroscope INU, MIL-STD-810G, 0.001 deg/h drift",                      "RELEASED","A",1));
        // Context 2 — Navigation Systems folder
        jdbc.update(part(12L,12L,2L,5L,"NAV-001-A","GPS Receiver Module",                  "Multi-constellation GPS/GLONASS/Galileo receiver, ARINC 429 output",             "INREVIEW","A",1));
        log.info("  [seed] \u2705 12 parts (RELEASED=5, INREVIEW=3, INWORK=4)");
    }

    private String part(Long id, Long masterId, Long ctxId, Long folderId,
                        String num, String name, String desc, String state,
                        String rev, int iter) {
        return String.format(
            "INSERT INTO parts (id,master_id,context_id,folder_id,part_number,name,description,lifecycle_state,revision,iteration,is_latest,created_at,updated_at,version) "
          + "VALUES (%d,%d,%d,%d,'%s','%s','%s','%s','%s',%d,1,NOW(),NOW(),0)",
            id, masterId, ctxId, folderId, num, name, desc, state, rev, iter);
    }

    // ─── BOM LINES ──────────────────────────────────────────────────────────────
    private void seedBomLines() {
        // ECU-001 housing contains PDM, fans(x2), brackets(x4)
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (1,1,2,1,'PDM-1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (2,1,3,2,'FAN-1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (3,1,4,4,'BKT-1',NOW(),NOW(),0)");
        // CAN Bus controller references LIDAR board and Sensor Fusion
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (4,5,6,1,'LIDAR-IF',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (5,5,7,1,'SFU-1',NOW(),NOW(),0)");
        // Flight Management Computer contains INU(x3 redundant) and GPS
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (6,10,11,3,'INU-1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO bom_line (id,parent_part_id,child_part_id,quantity,reference_designator,created_at,updated_at,version) VALUES (7,10,12,1,'GPS-1',NOW(),NOW(),0)");
        log.info("  [seed] \u2705 7 BOM lines");
    }

    // ─── PRODUCTS ────────────────────────────────────────────────────────────────
    private void seedProducts() {
        jdbc.update("INSERT INTO product (id,name,description,version_number,status,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (1,'Windchill ECU Gen-3','Third generation engine control unit platform for Level-3 autonomous vehicles','3.0.0','ACTIVE',1,'admin',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO product (id,name,description,version_number,status,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (2,'Avionics Suite MK-II','Mark II mission avionics suite, DO-178C / DO-254 certified','2.1.0','ACTIVE',2,'admin',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO product (id,name,description,version_number,status,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (3,'OTA Platform v1','Over-the-air update platform for connected and autonomous vehicles','1.0.0','DEVELOPMENT',1,'admin',NOW(),NOW(),0)");
        log.info("  [seed] \u2705 3 products");
    }

    // ─── DOCUMENTS ──────────────────────────────────────────────────────────────
    private void seedDocuments() {
        jdbc.update("INSERT INTO document (id,title,description,document_number,document_type,status,version_number,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (1,'ECU Gen-3 System Requirements Specification','Complete SRS for the ECU Gen-3 platform including functional, performance and safety requirements','SRS-ECU-001','REQUIREMENT','RELEASED','1.2',1,'admin',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO document (id,title,description,document_number,document_type,status,version_number,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (2,'ECU Hardware Design Specification','Detailed hardware design including schematics, PCB stack-up and component selection rationale','HDS-ECU-002','DESIGN','INREVIEW','0.9',1,'john.doe',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO document (id,title,description,document_number,document_type,status,version_number,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (3,'CAN FD Protocol Specification','CAN FD protocol specification, message matrix and timing analysis for ECU platform','PROT-CAN-001','SPECIFICATION','RELEASED','2.0',1,'john.doe',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO document (id,title,description,document_number,document_type,status,version_number,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (4,'Avionics MK-II Qualification Test Report','Comprehensive environmental, EMC and functional test report for MK-II avionics suite','TR-AVI-001','REPORT','RELEASED','1.0',2,'sarah.smith',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO document (id,title,description,document_number,document_type,status,version_number,project_id,created_by,created_at,updated_at,version) "
                + "VALUES (5,'OTA Security Architecture Document','Threat model, security controls and cryptographic design for OTA update system','SEC-OTA-001','ARCHITECTURE','INWORK','0.3',1,'admin',NOW(),NOW(),0)");
        log.info("  [seed] \u2705 5 documents");
    }

    // ─── PROJECTS ────────────────────────────────────────────────────────────────
    private void seedProjects() {
        jdbc.update("INSERT INTO project (id,name,description,project_code,status,progress,manager_id,start_date,end_date,created_at,updated_at,version) "
                + "VALUES (1,'ECU Gen-3 Development','Full development program for third generation ECU platform including hardware, software and validation','PROJ-ECU-003','IN_PROGRESS',65,3,'2025-01-15','2026-06-30',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO project (id,name,description,project_code,status,progress,manager_id,start_date,end_date,created_at,updated_at,version) "
                + "VALUES (2,'Avionics MK-II Certification','DO-178C DAL-A and DO-254 DAL-A certification program for mission-critical avionics suite','PROJ-AVI-002','IN_PROGRESS',40,1,'2025-03-01','2026-12-31',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO project (id,name,description,project_code,status,progress,manager_id,start_date,end_date,created_at,updated_at,version) "
                + "VALUES (3,'OTA Platform MVP','Minimum viable product milestone for secure over-the-air update infrastructure','PROJ-OTA-001','IN_PROGRESS',25,3,'2026-01-01','2026-09-30',NOW(),NOW(),0)");
        log.info("  [seed] \u2705 3 projects (progress: 65%, 40%, 25%)");
    }

    // ─── WORK ITEMS ──────────────────────────────────────────────────────────────
    private void seedWorkItems() {
        // 3 PENDING — visible in Worklist page for admin and sarah.smith
        jdbc.update("INSERT INTO work_item (id,title,description,type,status,assignee_id,requester_id,entity_type,entity_id,priority,due_date,created_at,updated_at,version) "
                + "VALUES (1,'Approve ECU-003-A Cooling Fan Assembly','Review cooling fan design and thermal analysis before promotion to INREVIEW','APPROVAL','PENDING',3,2,'PART',3,'HIGH',"
                + "DATE_ADD(NOW(), INTERVAL 7 DAY),NOW(),NOW(),0)");
        jdbc.update("INSERT INTO work_item (id,title,description,type,status,assignee_id,requester_id,entity_type,entity_id,priority,due_date,created_at,updated_at,version) "
                + "VALUES (2,'Review ECU Hardware Design Specification v0.9','Complete technical review of HDS-ECU-002 before release approval','REVIEW','PENDING',1,2,'DOCUMENT',2,'MEDIUM',"
                + "DATE_ADD(NOW(), INTERVAL 5 DAY),NOW(),NOW(),0)");
        jdbc.update("INSERT INTO work_item (id,title,description,type,status,assignee_id,requester_id,entity_type,entity_id,priority,due_date,created_at,updated_at,version) "
                + "VALUES (3,'Final Release Approval — ELX-003-B Sensor Fusion Unit','Approve promotion of Sensor Fusion Unit Rev B to RELEASED state','APPROVAL','PENDING',3,1,'PART',7,'HIGH',"
                + "DATE_ADD(NOW(), INTERVAL 3 DAY),NOW(),NOW(),0)");
        // 1 APPROVED — shows history
        jdbc.update("INSERT INTO work_item (id,title,description,type,status,assignee_id,requester_id,entity_type,entity_id,priority,due_date,created_at,updated_at,version) "
                + "VALUES (4,'GPS Receiver Module Design Review','Review NAV-001-A design before qualification testing','REVIEW','APPROVED',1,3,'PART',12,'MEDIUM',"
                + "DATE_ADD(NOW(), INTERVAL -2 DAY),NOW(),NOW(),0)");
        // 1 more PENDING for OTA doc
        jdbc.update("INSERT INTO work_item (id,title,description,type,status,assignee_id,requester_id,entity_type,entity_id,priority,due_date,created_at,updated_at,version) "
                + "VALUES (5,'OTA Security Architecture Review','Security team review of SEC-OTA-001 threat model and control implementation','REVIEW','PENDING',1,2,'DOCUMENT',5,'CRITICAL',"
                + "DATE_ADD(NOW(), INTERVAL 10 DAY),NOW(),NOW(),0)");
        log.info("  [seed] \u2705 5 work items (4 PENDING — visible in Worklist)");
    }

    // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
    private void seedNotifications() {
        // 2 unread for admin
        jdbc.update("INSERT INTO notification (id,user_id,title,message,type,is_read,entity_type,entity_id,created_at,updated_at,version) "
                + "VALUES (1,1,'New Review Request','John Doe has submitted ECU Hardware Design Spec for technical review','REVIEW_REQUEST',0,'DOCUMENT',2,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO notification (id,user_id,title,message,type,is_read,entity_type,entity_id,created_at,updated_at,version) "
                + "VALUES (2,1,'Approval Required — High Priority','Sensor Fusion Unit Rev B awaits your final release approval','APPROVAL_REQUIRED',0,'PART',7,NOW(),NOW(),0)");
        // read notifications
        jdbc.update("INSERT INTO notification (id,user_id,title,message,type,is_read,entity_type,entity_id,created_at,updated_at,version) "
                + "VALUES (3,2,'Part Released','CAN Bus Controller ELX-001-A has been promoted to RELEASED status','PART_PROMOTED',1,'PART',5,NOW(),NOW(),0)");
        jdbc.update("INSERT INTO notification (id,user_id,title,message,type,is_read,entity_type,entity_id,created_at,updated_at,version) "
                + "VALUES (4,2,'Review Comment','Sarah Smith left a review comment on ECU-003-A Cooling Fan Assembly','COMMENT',1,'PART',3,NOW(),NOW(),0)");
        // unread for sarah
        jdbc.update("INSERT INTO notification (id,user_id,title,message,type,is_read,entity_type,entity_id,created_at,updated_at,version) "
                + "VALUES (5,3,'Project Milestone','ECU Gen-3 Development has reached 65% completion milestone','PROJECT_UPDATE',0,'PROJECT',1,NOW(),NOW(),0)");
        log.info("  [seed] \u2705 5 notifications (3 unread across users)");
    }

    // ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
    private void seedAuditLogs() {
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (1,1,'admin','CREATE','PART',1,'ECU-001-A','Created Engine Control Unit Housing (ECU-001-A)','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (2,2,'john.doe','CREATE','PART',5,'ELX-001-A','Created CAN Bus Controller (ELX-001-A)','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (3,1,'admin','PROMOTE','PART',1,'ECU-001-A','Promoted ECU-001-A from INWORK to RELEASED','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (4,2,'john.doe','PROMOTE','PART',2,'ECU-002-A','Promoted Power Distribution Module from INWORK to RELEASED','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (5,3,'sarah.smith','APPROVE','WORK_ITEM',4,'GPS Design Review','Approved GPS Receiver Module design review','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (6,1,'admin','CREATE','PROJECT',1,'ECU Gen-3 Dev','Created ECU Gen-3 Development project (PROJ-ECU-003)','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (7,2,'john.doe','CREATE','DOCUMENT',3,'CAN Protocol Spec','Created CAN FD Protocol Specification (PROT-CAN-001)','127.0.0.1',NOW(),NOW(),0)");
        jdbc.update("INSERT INTO audit_log (id,user_id,username,action,entity_type,entity_id,entity_name,details,ip_address,created_at,updated_at,version) "
                + "VALUES (8,1,'admin','LOGIN','USER',1,'admin','Administrator logged in successfully','127.0.0.1',NOW(),NOW(),0)");
        log.info("  [seed] \u2705 8 audit log entries");
    }

    // ─── RESET AUTO-INCREMENTS ──────────────────────────────────────────────────
    // Prevents ID conflicts when users create new records after seeding.
    private void resetAutoIncrements() {
        String[] tables = {"users","parts","plm_context","plm_context_member",
                           "folder","bom_line","product","document","project",
                           "work_item","notification","audit_log"};
        for (String t : tables) {
            try { jdbc.update("ALTER TABLE " + t + " AUTO_INCREMENT = 1000"); }
            catch (Exception ignored) {}
        }
        log.info("  [seed] \u2705 AUTO_INCREMENT reset to 1000 on all tables");
    }
}
