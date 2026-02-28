package com.windchill.domain.entity;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PromotionRequestStatusEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "promotion_requests",
        indexes = {
                @Index(name = "idx_pr_part", columnList = "part_id"),
                @Index(name = "idx_pr_context", columnList = "context_id"),
                @Index(name = "idx_pr_status", columnList = "status")
        }
)
public class PromotionRequest extends BaseEntity {

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_state", nullable = false, length = 20)
    private LifecycleStateEnum fromState;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_state", nullable = false, length = 20)
    private LifecycleStateEnum toState;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private PromotionRequestStatusEnum status = PromotionRequestStatusEnum.PENDING_APPROVAL;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by_user_id")
    private Long completedByUserId;
}
