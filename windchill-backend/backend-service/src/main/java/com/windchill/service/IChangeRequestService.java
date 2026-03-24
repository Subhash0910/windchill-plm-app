package com.windchill.service;

import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.domain.entity.ChangeNotice;
import com.windchill.domain.entity.ChangeOrderItem;
import com.windchill.domain.entity.ChangeRequest;

import java.util.List;

/**
 * IChangeRequestService — contract for all ECR / ECO / ECN operations.
 */
public interface IChangeRequestService {

    // ── CRUD ──────────────────────────────────────────────────────────────────

    /** Create a new ECR in DRAFT state. */
    ChangeRequest create(Long contextId, String title, String description,
                         String reason, String priority,
                         List<Long> impactedPartIds, String createdBy);

    ChangeRequest getById(Long id);

    List<ChangeRequest> listByContext(Long contextId);

    List<ChangeRequest> listByStatus(ChangeRequestStatus status);

    List<ChangeRequest> listByContextAndStatus(Long contextId, ChangeRequestStatus status);

    List<ChangeRequest> listByCreator(String username);

    List<ChangeRequest> findByImpactedPart(Long partId);

    // ── Lifecycle transitions ─────────────────────────────────────────────────

    /**
     * DRAFT → SUBMITTED.
     * Any context member may submit their own ECR.
     */
    ChangeRequest submit(Long id, String submittedBy);

    /**
     * SUBMITTED → IN_REVIEW.
     * APPROVER or MANAGER picks up the ECR.
     */
    ChangeRequest startReview(Long id, String reviewerUsername);

    /**
     * IN_REVIEW → APPROVED.
     * Triggers: revisePart() for all impacted parts + auto-creates ECN.
     * Only APPROVER / MANAGER / ADMIN may call this.
     */
    ChangeRequest approve(Long id, String reviewerUsername, String comment);

    /**
     * IN_REVIEW → REJECTED.
     * Only APPROVER / MANAGER / ADMIN may call this.
     */
    ChangeRequest reject(Long id, String reviewerUsername, String comment);

    /**
     * APPROVED | REJECTED → CLOSED.
     */
    ChangeRequest close(Long id, String closedBy);

    /**
     * REJECTED → DRAFT  (re-open for rework).
     */
    ChangeRequest reopen(Long id, String requestedBy);

    // ── Change Order Items ────────────────────────────────────────────────────

    List<ChangeOrderItem> getOrderItems(Long changeRequestId);

    // ── Change Notice ─────────────────────────────────────────────────────────

    ChangeNotice getNoticeByChangeRequest(Long changeRequestId);

    ChangeNotice getNoticeById(Long noticeId);

    List<ChangeNotice> listNoticesByContext(Long contextId);

    ChangeNotice releaseNotice(Long noticeId, String releasedBy);
}
