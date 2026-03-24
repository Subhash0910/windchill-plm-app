package com.windchill.service.impl;

import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeNoticeStatus;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.*;
import com.windchill.repository.*;
import com.windchill.service.IChangeRequestService;
import com.windchill.service.INotificationService;
import com.windchill.service.plm.IPartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChangeRequestServiceImpl implements IChangeRequestService {

    private final ChangeRequestRepository  changeRequestRepo;
    private final ChangeOrderItemRepository changeOrderItemRepo;
    private final ChangeNoticeRepository    changeNoticeRepo;
    private final AuditLogRepository        auditLogRepo;
    private final IPartService              partService;
    private final INotificationService      notificationService;
    private final UserRepository            userRepo;

    // ── number generation ──────────────────────────────────────────────────────

    private String nextChangeNumber() {
        long count = changeRequestRepo.countAll() + 1;
        return String.format("ECR-%04d", count);
    }

    private String nextNoticeNumber() {
        long count = changeNoticeRepo.count() + 1;
        return String.format("ECN-%04d", count);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private String encodePartIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return "";
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private List<Long> decodePartIds(String encoded) {
        if (encoded == null || encoded.isBlank()) return List.of();
        return Arrays.stream(encoded.split(","))
                     .map(String::trim)
                     .filter(s -> !s.isEmpty())
                     .map(Long::parseLong)
                     .collect(Collectors.toList());
    }

    /**
     * Write an audit log entry for a PART entity.
     * CHANGE_REQUEST and CHANGE_NOTICE are not in PlmEntityTypeEnum,
     * so for those we log against PART with contextual detail.
     */
    private void audit(String entityTypeName, Long entityId, String action, String actor, String detail) {
        try {
            PlmEntityTypeEnum type = PlmEntityTypeEnum.PART;
            try {
                type = PlmEntityTypeEnum.valueOf(entityTypeName);
            } catch (IllegalArgumentException ignored) {
                // entityType not in enum — still log with PART as a safe fallback
            }
            AuditLog entry = new AuditLog();
            entry.setEntityType(type);
            entry.setEntityId(entityId);
            entry.setAction(action);
            entry.setActor(actor);
            entry.setDetails(detail);
            auditLogRepo.save(entry);
        } catch (Exception ex) {
            log.warn("Audit log failed (non-fatal): {}", ex.getMessage());
        }
    }

    /**
     * Send a notification to a user by username lookup.
     * INotificationService.create() takes a userId, so we resolve username -> userId first.
     */
    private void notify(Long contextId, String username, String title, String message, String link) {
        try {
            userRepo.findByUsername(username).ifPresent(u ->
                notificationService.create(
                    u.getId(), title, message,
                    "ECR", "CHANGE_REQUEST", contextId, title
                )
            );
        } catch (Exception ex) {
            log.warn("Notification send failed (non-fatal): {}", ex.getMessage());
        }
    }

    private ChangeRequest requireById(Long id) {
        return changeRequestRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("ChangeRequest not found: " + id));
    }

    private void assertStatus(ChangeRequest cr, ChangeRequestStatus... allowed) {
        for (ChangeRequestStatus s : allowed) {
            if (cr.getStatus() == s) return;
        }
        throw new IllegalStateException(
            "Operation not allowed in status: " + cr.getStatus() +
            ". Expected one of: " + Arrays.toString(allowed));
    }

    // ── CRUD ───────────────────────────────────────────────────────────────────

    @Override
    public ChangeRequest create(Long contextId, String title, String description,
                                String reason, String priority,
                                List<Long> impactedPartIds, String createdBy) {
        ChangeRequest cr = new ChangeRequest();
        cr.setChangeNumber(nextChangeNumber());
        cr.setContextId(contextId);
        cr.setTitle(title);
        cr.setDescription(description);
        cr.setReason(reason);
        cr.setPriority(priority != null
            ? ChangePriority.valueOf(priority.toUpperCase())
            : ChangePriority.NORMAL);
        cr.setStatus(ChangeRequestStatus.DRAFT);
        cr.setCreatedBy(createdBy);
        cr.setImpactedPartIds(encodePartIds(impactedPartIds));
        ChangeRequest saved = changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", saved.getId(), "CREATED", createdBy,
              "Created ECR " + saved.getChangeNumber() + ": " + title);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public ChangeRequest getById(Long id) {
        return requireById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> listByContext(Long contextId) {
        return changeRequestRepo.findByContextIdOrderByCreatedAtDesc(contextId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> listByStatus(ChangeRequestStatus status) {
        return changeRequestRepo.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> listByContextAndStatus(Long contextId, ChangeRequestStatus status) {
        return changeRequestRepo.findByContextIdAndStatusOrderByCreatedAtDesc(contextId, status);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> listByCreator(String username) {
        return changeRequestRepo.findByCreatedByOrderByCreatedAtDesc(username);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeRequest> findByImpactedPart(Long partId) {
        return changeRequestRepo.findByImpactedPartId(String.valueOf(partId));
    }

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    @Override
    public ChangeRequest submit(Long id, String submittedBy) {
        ChangeRequest cr = requireById(id);
        assertStatus(cr, ChangeRequestStatus.DRAFT, ChangeRequestStatus.REJECTED);
        cr.setStatus(ChangeRequestStatus.SUBMITTED);
        cr.setSubmittedBy(submittedBy);
        cr.setSubmittedAt(LocalDateTime.now());
        ChangeRequest saved = changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", id, "SUBMITTED", submittedBy, "Submitted for review");
        notify(cr.getContextId(), submittedBy,
               "ECR Submitted",
               saved.getChangeNumber() + " submitted for review.",
               "/plm/changes/" + id);
        return saved;
    }

    @Override
    public ChangeRequest startReview(Long id, String reviewerUsername) {
        ChangeRequest cr = requireById(id);
        assertStatus(cr, ChangeRequestStatus.SUBMITTED);
        cr.setStatus(ChangeRequestStatus.IN_REVIEW);
        cr.setReviewedBy(reviewerUsername);
        ChangeRequest saved = changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", id, "REVIEW_STARTED", reviewerUsername, "Review started");
        return saved;
    }

    @Override
    public ChangeRequest approve(Long id, String reviewerUsername, String comment) {
        ChangeRequest cr = requireById(id);
        assertStatus(cr, ChangeRequestStatus.IN_REVIEW, ChangeRequestStatus.SUBMITTED);

        cr.setStatus(ChangeRequestStatus.APPROVED);
        cr.setReviewedBy(reviewerUsername);
        cr.setReviewedAt(LocalDateTime.now());
        cr.setResolutionComment(comment);
        changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", id, "APPROVED", reviewerUsername,
              "Approved. Comment: " + comment);

        // ── auto-revise all impacted parts ─────────────────────────────────────
        List<Long> partIds = decodePartIds(cr.getImpactedPartIds());
        List<ChangeOrderItem> items = new ArrayList<>();
        for (Long partId : partIds) {
            try {
                Part original = partService.getPart(partId);
                Part revised  = partService.revise(partId);

                ChangeOrderItem item = new ChangeOrderItem();
                item.setChangeRequestId(id);
                item.setOriginalPartId(partId);
                item.setNewPartId(revised.getId());
                item.setOriginalPartNumber(original.getPartNumber());
                item.setOriginalRevision(original.getRevision());
                item.setNewRevision(revised.getRevision());
                item.setActionNote("Auto-revised on ECR approval");
                items.add(changeOrderItemRepo.save(item));

                audit("PART", partId, "REVISED_BY_ECR", reviewerUsername,
                      "Revised to " + revised.getRevision() + "." + revised.getIteration() +
                      " by " + cr.getChangeNumber());
            } catch (Exception ex) {
                log.error("Failed to revise part {} during ECR approval: {}", partId, ex.getMessage());
                audit("PART", partId, "REVISE_FAILED", reviewerUsername,
                      "Could not revise part " + partId + ": " + ex.getMessage());
            }
        }

        // ── auto-create ECN ────────────────────────────────────────────────────
        ChangeNotice notice = new ChangeNotice();
        notice.setNoticeNumber(nextNoticeNumber());
        notice.setContextId(cr.getContextId());
        notice.setChangeRequestId(id);
        notice.setTitle("ECN for " + cr.getChangeNumber() + ": " + cr.getTitle());
        notice.setSummary("Automatically generated upon approval of " + cr.getChangeNumber() +
                          ". Impacted parts revised: " + partIds.size());
        notice.setStatus(ChangeNoticeStatus.OPEN);
        notice.setCreatedBy(reviewerUsername);
        ChangeNotice savedNotice = changeNoticeRepo.save(notice);

        cr.setChangeNoticeId(savedNotice.getId());
        ChangeRequest finalCr = changeRequestRepo.save(cr);

        notify(cr.getContextId(), reviewerUsername,
               "ECR Approved",
               cr.getChangeNumber() + " approved. " + partIds.size() +
               " part(s) revised. ECN " + savedNotice.getNoticeNumber() + " issued.",
               "/plm/changes/" + id);

        return finalCr;
    }

    @Override
    public ChangeRequest reject(Long id, String reviewerUsername, String comment) {
        ChangeRequest cr = requireById(id);
        assertStatus(cr, ChangeRequestStatus.IN_REVIEW, ChangeRequestStatus.SUBMITTED);
        cr.setStatus(ChangeRequestStatus.REJECTED);
        cr.setReviewedBy(reviewerUsername);
        cr.setReviewedAt(LocalDateTime.now());
        cr.setResolutionComment(comment);
        ChangeRequest saved = changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", id, "REJECTED", reviewerUsername,
              "Rejected. Comment: " + comment);
        notify(cr.getContextId(), cr.getCreatedBy(),
               "ECR Rejected",
               cr.getChangeNumber() + " was rejected. Reason: " + comment,
               "/plm/changes/" + id);
        return saved;
    }

    @Override
    public ChangeRequest close(Long id, String closedBy) {
        ChangeRequest cr = requireById(id);
        assertStatus(cr, ChangeRequestStatus.APPROVED, ChangeRequestStatus.REJECTED);
        cr.setStatus(ChangeRequestStatus.CLOSED);
        cr.setClosedBy(closedBy);
        cr.setClosedAt(LocalDateTime.now());
        ChangeRequest saved = changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", id, "CLOSED", closedBy, "ECR closed");
        return saved;
    }

    @Override
    public ChangeRequest reopen(Long id, String requestedBy) {
        ChangeRequest cr = requireById(id);
        assertStatus(cr, ChangeRequestStatus.REJECTED);
        cr.setStatus(ChangeRequestStatus.DRAFT);
        cr.setResolutionComment(null);
        cr.setReviewedAt(null);
        cr.setReviewedBy(null);
        ChangeRequest saved = changeRequestRepo.save(cr);
        audit("CHANGE_REQUEST", id, "REOPENED", requestedBy, "Reopened for rework after rejection");
        return saved;
    }

    // ── Change Order Items ─────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<ChangeOrderItem> getOrderItems(Long changeRequestId) {
        return changeOrderItemRepo.findByChangeRequestIdOrderByIdAsc(changeRequestId);
    }

    // ── Change Notice ──────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ChangeNotice getNoticeByChangeRequest(Long changeRequestId) {
        return changeNoticeRepo.findByChangeRequestId(changeRequestId).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public ChangeNotice getNoticeById(Long noticeId) {
        return changeNoticeRepo.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("ChangeNotice not found: " + noticeId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChangeNotice> listNoticesByContext(Long contextId) {
        return changeNoticeRepo.findByContextIdOrderByCreatedAtDesc(contextId);
    }

    @Override
    public ChangeNotice releaseNotice(Long noticeId, String releasedBy) {
        ChangeNotice notice = changeNoticeRepo.findById(noticeId)
            .orElseThrow(() -> new IllegalArgumentException("ChangeNotice not found: " + noticeId));
        if (notice.getStatus() != ChangeNoticeStatus.OPEN) {
            throw new IllegalStateException("Only OPEN notices can be released. Current: " + notice.getStatus());
        }
        notice.setStatus(ChangeNoticeStatus.RELEASED);
        notice.setReleasedBy(releasedBy);
        notice.setReleasedAt(LocalDateTime.now());
        ChangeNotice saved = changeNoticeRepo.save(notice);
        audit("CHANGE_NOTICE", noticeId, "RELEASED", releasedBy,
              "ECN " + notice.getNoticeNumber() + " released");
        return saved;
    }
}
