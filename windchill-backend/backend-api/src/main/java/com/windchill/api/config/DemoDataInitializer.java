package com.windchill.api.config;

import com.windchill.common.enums.*;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds rich demo data for the `demo` profile (Render free tier).
 * Runs after DevAdminInitializer (which seeds admin + DEFAULT context).
 * Idempotent: checks part count before inserting.
 */
@Slf4j
@Configuration
@Profile("demo")
@RequiredArgsConstructor
public class DemoDataInitializer {

    private final UserRepository            userRepo;
    private final PlmContextRepository      contextRepo;
    private final FolderRepository          folderRepo;
    private final PartRepository            partRepo;
    private final BomLineRepository         bomRepo;
    private final ChangeRequestRepository   ecrRepo;
    private final PromotionRequestRepository promoRepo;
    private final WorkItemRepository        workItemRepo;
    private final NotificationRepository    notifRepo;
    private final AuditLogRepository        auditRepo;
    private final PasswordEncoder           passwordEncoder;

    @Bean
    @DependsOn("ensureDefaultAdmin")
    public ApplicationRunner seedDemoData() {
        return args -> {
            if (partRepo.count() > 0) {
                log.info("Demo data already present — skipping seed");
                return;
            }
            log.info("Seeding demo data...");

            // ── 1. Users ──────────────────────────────────────────────────────
            String hash = passwordEncoder.encode("admin123");
            User john   = saveUser("john.doe",    "john.doe@windchill-plm.com",    "John",   "Doe",    RoleEnum.ENGINEER, "Mechanical Engineering", hash);
            User sarah  = saveUser("sarah.smith",  "sarah.smith@windchill-plm.com", "Sarah",  "Smith",  RoleEnum.MANAGER,  "Product Management",     hash);
            User mike   = saveUser("mike.wilson",  "mike.wilson@windchill-plm.com", "Mike",   "Wilson", RoleEnum.VIEWER,   "Quality Assurance",      hash);
            User admin  = userRepo.findActiveUserByUsername("admin")
                                  .orElseThrow(() -> new IllegalStateException("admin must exist before DemoDataInitializer runs"));

            // ── 2. Contexts ───────────────────────────────────────────────────
            PlmContext ecuCtx = saveContext("ECU-PLATFORM", "Automotive ECU Platform",
                    ContextTypeEnum.PRODUCT, "ECU development platform for next-gen autonomous vehicles");
            PlmContext aviCtx = saveContext("DEF-AVIONICS",  "Defense Avionics Suite",
                    ContextTypeEnum.LIBRARY, "Mission-critical avionics for defense and aerospace");

            // ── 3. Folders ────────────────────────────────────────────────────
            Folder mechFolder  = saveFolder(ecuCtx.getId(), null, "Mechanical Components", "/Mechanical Components");
            Folder elecFolder  = saveFolder(ecuCtx.getId(), null, "Electronic Systems",    "/Electronic Systems");
            Folder swFolder    = saveFolder(ecuCtx.getId(), null, "Software Modules",      "/Software Modules");
            Folder aviHwFolder = saveFolder(aviCtx.getId(), null, "Avionics Hardware",     "/Avionics Hardware");
            Folder navFolder   = saveFolder(aviCtx.getId(), null, "Navigation Systems",    "/Navigation Systems");

            // ── 4. Parts ──────────────────────────────────────────────────────
            // ECU — Mechanical
            Part housing  = savePart(ecuCtx.getId(), mechFolder.getId(), "ECU-001-A", "Engine Control Unit Housing",
                    "Aluminum housing for main ECU with integrated thermal management fins",
                    LifecycleStateEnum.RELEASED, "A", "john.doe");
            Part pdm      = savePart(ecuCtx.getId(), mechFolder.getId(), "ECU-002-A", "Power Distribution Module",
                    "High-density PCB for power distribution, 150 A continuous, 200 A peak",
                    LifecycleStateEnum.RELEASED, "A", "john.doe");
            Part fan      = savePart(ecuCtx.getId(), mechFolder.getId(), "ECU-003-A", "Cooling Fan Assembly",
                    "Variable-speed brushless cooling fan, 12 V DC, 2000–5000 RPM",
                    LifecycleStateEnum.INWORK, "A", "john.doe");
            Part bracket  = savePart(ecuCtx.getId(), mechFolder.getId(), "ECU-004-A", "Mounting Bracket Set",
                    "Stainless-steel M8 mounting bracket set, 4-bolt pattern, vibration-damped",
                    LifecycleStateEnum.UNDERREVIEW, "A", "john.doe");
            // ECU — Electronic
            Part canCtrl  = savePart(ecuCtx.getId(), elecFolder.getId(), "ELX-001-A", "CAN Bus Controller",
                    "Automotive-grade CAN FD controller, ISO 11898-2, 5 Mbps capable",
                    LifecycleStateEnum.RELEASED, "A", "john.doe");
            Part lidar    = savePart(ecuCtx.getId(), elecFolder.getId(), "ELX-002-A", "LIDAR Interface Board",
                    "High-speed LIDAR data-acquisition PCB, 100 Mbps Ethernet interface",
                    LifecycleStateEnum.INWORK, "A", "john.doe");
            Part sfu      = savePart(ecuCtx.getId(), elecFolder.getId(), "ELX-003-B", "Sensor Fusion Unit",
                    "Multi-sensor data-fusion processor Rev B — improved latency and accuracy",
                    LifecycleStateEnum.UNDERREVIEW, "B", "john.doe");
            // ECU — Software
            Part autosar  = savePart(ecuCtx.getId(), swFolder.getId(), "SW-001-A", "AUTOSAR BSW Stack",
                    "Base Software stack compliant with AUTOSAR Classic 4.4",
                    LifecycleStateEnum.RELEASED, "A", "admin");
            Part otaMgr   = savePart(ecuCtx.getId(), swFolder.getId(), "SW-002-A", "OTA Update Manager",
                    "Over-the-air firmware update manager, AES-256 encrypted delta patches",
                    LifecycleStateEnum.INWORK, "A", "admin");
            // Avionics
            Part fmc      = savePart(aviCtx.getId(), aviHwFolder.getId(), "AVI-001-A", "Flight Management Computer",
                    "DO-178C DAL-A certified FMC, triple-redundant hot-standby architecture",
                    LifecycleStateEnum.RELEASED, "A", "admin");
            Part inu      = savePart(aviCtx.getId(), aviHwFolder.getId(), "AVI-002-A", "Inertial Navigation Unit",
                    "Ring-laser gyroscope INU, MIL-STD-810G qualified, 0.001 deg/h drift",
                    LifecycleStateEnum.RELEASED, "A", "admin");
            Part gps      = savePart(aviCtx.getId(), navFolder.getId(),   "NAV-001-A", "GPS Receiver Module",
                    "Multi-constellation GPS/GLONASS/Galileo receiver, ARINC 429 output",
                    LifecycleStateEnum.UNDERREVIEW, "A", "sarah.smith");

            // Fix master IDs (self-referential after save)
            setMasterIds(housing, pdm, fan, bracket, canCtrl, lidar, sfu, autosar, otaMgr, fmc, inu, gps);

            // ── 5. BOM Lines ──────────────────────────────────────────────────
            saveBom(housing.getId(), pdm.getId(),     BigDecimal.ONE,                  "EA", "PDM-1");
            saveBom(housing.getId(), fan.getId(),     new BigDecimal("2"),             "EA", "FAN-1");
            saveBom(housing.getId(), bracket.getId(), new BigDecimal("4"),             "EA", "BKT-1");
            saveBom(canCtrl.getId(), lidar.getId(),   BigDecimal.ONE,                  "EA", "LDR-1");
            saveBom(canCtrl.getId(), sfu.getId(),     BigDecimal.ONE,                  "EA", "SFU-1");
            saveBom(fmc.getId(),     inu.getId(),     new BigDecimal("3"),             "EA", "INU-1");
            saveBom(fmc.getId(),     gps.getId(),     BigDecimal.ONE,                  "EA", "GPS-1");

            // ── 6. Change Requests (ECRs) ─────────────────────────────────────
            ChangeRequest ecr1 = saveEcr("ECR-2026-001",
                    "Replace CAN FD controller with newer automotive-grade chip",
                    "The current CAN FD controller (ELX-001-A) has been flagged by procurement as EOL. " +
                    "This ECR evaluates and qualifies a drop-in replacement.",
                    ecuCtx.getId(), ChangeRequestStatus.SUBMITTED, ChangePriority.HIGH,
                    "john.doe", null, null);

            ChangeRequest ecr2 = saveEcr("ECR-2026-002",
                    "Update ECU housing thermal pad specification",
                    "Thermal analysis shows the housing runs 8°C above target at peak load. " +
                    "ECR to revise thermal interface material and add heat-spreader.",
                    ecuCtx.getId(), ChangeRequestStatus.IN_REVIEW, ChangePriority.HIGH,
                    "john.doe", "sarah.smith", LocalDateTime.now().minusDays(5));

            saveEcr("ECR-2026-003",
                    "Integrate GPS multi-constellation firmware update",
                    "NAV-001-A requires firmware v3.1 to support Galileo E6 band corrections. " +
                    "Update scope: firmware qualification, updated ARINC 429 driver, avionics test report addendum.",
                    aviCtx.getId(), ChangeRequestStatus.APPROVED, ChangePriority.NORMAL,
                    "sarah.smith", "admin", LocalDateTime.now().minusDays(7));

            saveEcr("ECR-2026-004",
                    "OTA security hardening — upgrade AES-256-GCM cipher suite",
                    "Security audit identified CBC mode in OTA Update Manager. " +
                    "This ECR mandates migration to GCM for authenticated encryption.",
                    ecuCtx.getId(), ChangeRequestStatus.IN_REVIEW, ChangePriority.CRITICAL,
                    "admin", null, null);

            saveEcr("ECR-2026-005",
                    "Add vibration isolation to sensor fusion mounting",
                    "Endurance testing of ELX-003-B shows connector fretting failures at 200 Hz resonance. " +
                    "ECR proposes anti-vibration mounts and rerouted flex harness.",
                    ecuCtx.getId(), ChangeRequestStatus.SUBMITTED, ChangePriority.NORMAL,
                    "john.doe", null, null);

            // ── 7. Promotion Requests + Work Items (Worklist) ─────────────────
            // bracket (UNDERREVIEW) has a pending promotion request
            PromotionRequest pr1 = savePromo(ecuCtx.getId(), bracket.getId(), admin.getId(),
                    LifecycleStateEnum.INWORK, LifecycleStateEnum.UNDERREVIEW,
                    PromotionRequestStatusEnum.PENDING_APPROVAL);
            saveWorkItem(pr1.getId(), ecuCtx.getId(), bracket.getId(), sarah.getId());

            // sfu (UNDERREVIEW) has a pending promotion request
            PromotionRequest pr2 = savePromo(ecuCtx.getId(), sfu.getId(), john.getId(),
                    LifecycleStateEnum.INWORK, LifecycleStateEnum.UNDERREVIEW,
                    PromotionRequestStatusEnum.PENDING_APPROVAL);
            saveWorkItem(pr2.getId(), ecuCtx.getId(), sfu.getId(), admin.getId());

            // gps (UNDERREVIEW) has a pending promotion request
            PromotionRequest pr3 = savePromo(aviCtx.getId(), gps.getId(), sarah.getId(),
                    LifecycleStateEnum.INWORK, LifecycleStateEnum.UNDERREVIEW,
                    PromotionRequestStatusEnum.PENDING_APPROVAL);
            saveWorkItem(pr3.getId(), aviCtx.getId(), gps.getId(), admin.getId());

            // ── 8. Notifications ──────────────────────────────────────────────
            // admin
            saveNotif(admin.getId(), "ECR requires your review",
                    "ECR-2026-002 'Update ECU housing thermal pad' is IN_REVIEW and awaiting your sign-off.",
                    "ACTION_REQUIRED", "CHANGE_REQUEST", ecr2.getId(), "ECR-2026-002", false);
            saveNotif(admin.getId(), "New ECR submitted",
                    "ECR-2026-005 'Add vibration isolation to sensor fusion mounting' was submitted by john.doe.",
                    "INFO", "CHANGE_REQUEST", null, "ECR-2026-005", false);
            saveNotif(admin.getId(), "3 work items awaiting approval",
                    "Parts ECU-004-A, ELX-003-B, and NAV-001-A are in UNDERREVIEW and need your decision.",
                    "ACTION_REQUIRED", "WORK_ITEM", null, null, false);

            // john.doe
            saveNotif(john.getId(), "ECR-2026-004 needs your engineering review",
                    "ECR-2026-004 'OTA security hardening — upgrade AES-256-GCM cipher suite' requires your review.",
                    "ACTION_REQUIRED", "CHANGE_REQUEST", null, "ECR-2026-004", false);
            saveNotif(john.getId(), "Your ECR-2026-001 was submitted",
                    "ECR-2026-001 has been submitted and is awaiting a reviewer. You will be notified of the outcome.",
                    "INFO", "CHANGE_REQUEST", ecr1.getId(), "ECR-2026-001", true);
            saveNotif(john.getId(), "Part ECU-002-A promoted to RELEASED",
                    "Power Distribution Module (ECU-002-A) lifecycle state has been updated to RELEASED.",
                    "INFO", "PART", pdm.getId(), "ECU-002-A", true);

            // sarah.smith
            saveNotif(sarah.getId(), "ECR-2026-001 awaiting your review",
                    "ECR-2026-001 'Replace CAN FD controller' was submitted by john.doe and needs your review.",
                    "ACTION_REQUIRED", "CHANGE_REQUEST", ecr1.getId(), "ECR-2026-001", false);
            saveNotif(sarah.getId(), "Part ECU-004-A needs your approval",
                    "Mounting Bracket Set (ECU-004-A) has entered UNDERREVIEW. You are listed as reviewer.",
                    "ACTION_REQUIRED", "WORK_ITEM", null, "ECU-004-A", false);
            saveNotif(sarah.getId(), "Your ECR-2026-003 was approved",
                    "Change request ECR-2026-003 has been approved by admin. Proceed with ECO creation.",
                    "SUCCESS", "CHANGE_REQUEST", null, "ECR-2026-003", true);

            // mike.wilson
            saveNotif(mike.getId(), "Documents updated in ECU Platform",
                    "2 documents have been updated: ECU Hardware Design Specification and CAN FD Protocol Specification.",
                    "INFO", "DOCUMENT", null, null, false);
            saveNotif(mike.getId(), "Part NAV-001-A is UNDERREVIEW",
                    "GPS Receiver Module (NAV-001-A) has been submitted for review. You are listed as QA stakeholder.",
                    "INFO", "PART", gps.getId(), "NAV-001-A", true);

            // ── 9. Audit Logs ─────────────────────────────────────────────────
            saveAudit(PlmEntityTypeEnum.PART, housing.getId(),  "CREATE",  "admin",    "Created ECU-001-A Engine Control Unit Housing");
            saveAudit(PlmEntityTypeEnum.PART, pdm.getId(),      "CREATE",  "john.doe", "Created ECU-002-A Power Distribution Module");
            saveAudit(PlmEntityTypeEnum.PART, housing.getId(),  "PROMOTE", "admin",    "Promoted ECU-001-A: INWORK → RELEASED");
            saveAudit(PlmEntityTypeEnum.PART, pdm.getId(),      "PROMOTE", "john.doe", "Promoted ECU-002-A: INWORK → RELEASED");
            saveAudit(PlmEntityTypeEnum.PART, fmc.getId(),      "PROMOTE", "admin",    "Promoted AVI-001-A: INWORK → RELEASED");
            saveAudit(PlmEntityTypeEnum.PART, ecr1.getId(),     "CREATE",  "john.doe", "Created ECR-2026-001: Replace CAN FD controller");
            saveAudit(PlmEntityTypeEnum.PART, ecr2.getId(),     "SUBMIT",  "john.doe", "Submitted ECR-2026-002 for review");
            saveAudit(PlmEntityTypeEnum.CONTEXT, ecuCtx.getId(),"CREATE",  "admin",    "Created ECU-PLATFORM context");

            log.info("Demo data seeded: {} parts, {} ECRs, {} work items, {} notifications",
                    partRepo.count(), ecrRepo.count(), workItemRepo.count(), notifRepo.count());
        };
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User saveUser(String username, String email, String first, String last,
                          RoleEnum role, String dept, String hash) {
        return userRepo.findByUsername(username).orElseGet(() -> {
            User u = new User();
            u.setUsername(username);
            u.setEmail(email);
            u.setFirstName(first);
            u.setLastName(last);
            u.setRole(role);
            u.setDepartment(dept);
            u.setIsActive(true);
            u.setIsEmailVerified(true);
            u.setIsDeleted(false);
            u.setPasswordHash(hash);
            return userRepo.save(u);
        });
    }

    private PlmContext saveContext(String code, String name, ContextTypeEnum type, String desc) {
        return contextRepo.findByCode(code).orElseGet(() -> {
            PlmContext c = new PlmContext();
            c.setCode(code);
            c.setName(name);
            c.setContextType(type);
            c.setDescription(desc);
            c.setIsActive(true);
            c.setCreatedBy("admin");
            return contextRepo.save(c);
        });
    }

    private Folder saveFolder(Long contextId, Long parentId, String name, String path) {
        Folder f = new Folder();
        f.setContextId(contextId);
        f.setParentId(parentId);
        f.setName(name);
        f.setPath(path);
        f.setCreatedBy("admin");
        return folderRepo.save(f);
    }

    private Part savePart(Long contextId, Long folderId, String number, String name,
                          String desc, LifecycleStateEnum state, String rev, String by) {
        Part p = new Part();
        p.setContextId(contextId);
        p.setFolderId(folderId);
        p.setPartNumber(number);
        p.setName(name);
        p.setDescription(desc);
        p.setLifecycleState(state);
        p.setRevision(rev);
        p.setIteration(1);
        p.setIsLatest(true);
        p.setCreatedBy(by);
        Part saved = partRepo.save(p);
        saved.setMasterId(saved.getId());
        return partRepo.save(saved);
    }

    private void setMasterIds(Part... parts) {
        // already set inside savePart — no-op kept for clarity
    }

    private void saveBom(Long parentId, Long childId, BigDecimal qty, String unit, String findNum) {
        BomLine b = new BomLine();
        b.setParentPartId(parentId);
        b.setChildPartId(childId);
        b.setQuantity(qty);
        b.setUnit(unit);
        b.setFindNumber(findNum);
        b.setCreatedBy("admin");
        bomRepo.save(b);
    }

    private ChangeRequest saveEcr(String number, String title, String description,
                                   Long contextId, ChangeRequestStatus status, ChangePriority priority,
                                   String createdBy, String reviewedBy, LocalDateTime reviewedAt) {
        ChangeRequest ecr = new ChangeRequest();
        ecr.setChangeNumber(number);
        ecr.setContextId(contextId);
        ecr.setTitle(title);
        ecr.setDescription(description);
        ecr.setStatus(status);
        ecr.setPriority(priority);
        ecr.setCreatedBy(createdBy);
        if (status == ChangeRequestStatus.SUBMITTED || status == ChangeRequestStatus.IN_REVIEW
                || status == ChangeRequestStatus.APPROVED || status == ChangeRequestStatus.REJECTED) {
            ecr.setSubmittedBy(createdBy);
            ecr.setSubmittedAt(LocalDateTime.now().minusDays(10));
        }
        ecr.setReviewedBy(reviewedBy);
        ecr.setReviewedAt(reviewedAt);
        return ecrRepo.save(ecr);
    }

    private PromotionRequest savePromo(Long contextId, Long partId, Long requestedByUserId,
                                       LifecycleStateEnum from, LifecycleStateEnum to,
                                       PromotionRequestStatusEnum status) {
        PromotionRequest pr = new PromotionRequest();
        pr.setContextId(contextId);
        pr.setPartId(partId);
        pr.setRequestedByUserId(requestedByUserId);
        pr.setFromState(from);
        pr.setToState(to);
        pr.setStatus(status);
        pr.setCreatedBy("system");
        return promoRepo.save(pr);
    }

    private void saveWorkItem(Long promoId, Long contextId, Long partId, Long assigneeUserId) {
        WorkItem wi = new WorkItem();
        wi.setPromotionRequestId(promoId);
        wi.setContextId(contextId);
        wi.setPartId(partId);
        wi.setAssigneeUserId(assigneeUserId);
        wi.setStatus(WorkItemStatusEnum.PENDING);
        wi.setDueAt(LocalDateTime.now().plusDays(7));
        wi.setCreatedBy("system");
        workItemRepo.save(wi);
    }

    private void saveNotif(Long userId, String title, String message, String type,
                            String entityType, Long entityId, String entityNumber, boolean read) {
        Notification n = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .entityType(entityType)
                .entityId(entityId)
                .entityNumber(entityNumber)
                .read(read)
                .readAt(read ? LocalDateTime.now().minusDays(1) : null)
                .build();
        notifRepo.save(n);
    }

    private void saveAudit(PlmEntityTypeEnum entityType, Long entityId, String action, String actor, String details) {
        AuditLog a = new AuditLog();
        a.setEntityType(entityType);
        a.setEntityId(entityId);
        a.setAction(action);
        a.setActor(actor);
        a.setDetails(details);
        a.setCreatedBy(actor);
        auditRepo.save(a);
    }
}
