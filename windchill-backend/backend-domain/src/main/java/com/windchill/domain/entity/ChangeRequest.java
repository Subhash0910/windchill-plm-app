package com.windchill.domain.entity;

import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeRequestStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ChangeRequest (ECR — Engineering Change Request).
 *
 * Lifecycle:
 *   DRAFT  →  SUBMITTED  →  IN_REVIEW  →  APPROVED  →  CLOSED
 *                                       └→  REJECTED
 *
 * When status moves to APPROVED:
 *   - ChangeService calls PartService.revisePart() for every impacted part
 *   - A ChangeNotice (ECN) is automatically created
 *   - Notifications are sent to all watchers
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "change_requests",
    indexes = {
        @Index(name = "idx_cr_context",    columnList = "context_id"),
        @Index(name = "idx_cr_status",     columnList = "status"),
        @Index(name = "idx_cr_created_by", columnList = "created_by"),
        @Index(name = "idx_cr_number",     columnList = "change_number")
    }
)
public class ChangeRequest extends BaseEntity {

    /** Unique change number, e.g. ECR-0001 */
    @Column(name = "change_number", nullable = false, unique = true, length = 30)
    private String changeNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id", insertable = false, updatable = false)
    private PlmContext context;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "reason", columnDefinition = "LONGTEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    private ChangePriority priority = ChangePriority.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ChangeRequestStatus status = ChangeRequestStatus.DRAFT;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "submitted_by", length = 100)
    private String submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "resolution_comment", columnDefinition = "LONGTEXT")
    private String resolutionComment;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by", length = 100)
    private String closedBy;

    /** IDs of parts impacted by this change request (stored as comma-separated). */
    @Column(name = "impacted_part_ids", columnDefinition = "TEXT")
    private String impactedPartIds;

    /** Optional link to a ChangeNotice created when this ECR is approved. */
    @Column(name = "change_notice_id")
    private Long changeNoticeId;
}
