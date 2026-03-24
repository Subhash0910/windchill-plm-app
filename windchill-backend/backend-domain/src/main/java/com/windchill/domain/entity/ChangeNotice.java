package com.windchill.domain.entity;

import com.windchill.common.enums.ChangeNoticeStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * ChangeNotice (ECN — Engineering Change Notice).
 *
 * Auto-created when a ChangeRequest is APPROVED.
 * Represents the formal release notification that the change has been implemented.
 *
 * Lifecycle:  OPEN  →  RELEASED  →  OBSOLETE
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "change_notices",
    indexes = {
        @Index(name = "idx_cn_context",  columnList = "context_id"),
        @Index(name = "idx_cn_status",   columnList = "status"),
        @Index(name = "idx_cn_cr",       columnList = "change_request_id"),
        @Index(name = "idx_cn_number",   columnList = "notice_number")
    }
)
public class ChangeNotice extends BaseEntity {

    /** Unique notice number, e.g. ECN-0001 */
    @Column(name = "notice_number", nullable = false, unique = true, length = 30)
    private String noticeNumber;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    /** The ECR that triggered this notice */
    @Column(name = "change_request_id", nullable = false)
    private Long changeRequestId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "summary", columnDefinition = "LONGTEXT")
    private String summary;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ChangeNoticeStatus status = ChangeNoticeStatus.OPEN;

    @Column(name = "released_by", length = 100)
    private String releasedBy;

    @Column(name = "released_at")
    private LocalDateTime releasedAt;

    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;
}
