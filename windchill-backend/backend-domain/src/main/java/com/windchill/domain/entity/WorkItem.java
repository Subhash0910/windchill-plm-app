package com.windchill.domain.entity;

import com.windchill.common.enums.WorkItemStatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "work_items",
        indexes = {
                @Index(name = "idx_wi_pr", columnList = "promotion_request_id"),
                @Index(name = "idx_wi_assignee", columnList = "assignee_user_id"),
                @Index(name = "idx_wi_status", columnList = "status")
        }
)
public class WorkItem extends BaseEntity {

    @Column(name = "promotion_request_id", nullable = false)
    private Long promotionRequestId;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "assignee_user_id", nullable = false)
    private Long assigneeUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private WorkItemStatusEnum status = WorkItemStatusEnum.PENDING;

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by_user_id")
    private Long completedByUserId;
}
