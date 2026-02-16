package com.windchill.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "work_item_comments",
        indexes = {
                @Index(name = "idx_wic_work_item", columnList = "work_item_id"),
                @Index(name = "idx_wic_pr", columnList = "promotion_request_id")
        }
)
public class WorkItemComment extends BaseEntity {

    @Column(name = "promotion_request_id", nullable = false)
    private Long promotionRequestId;

    @Column(name = "work_item_id", nullable = false)
    private Long workItemId;

    @Column(name = "commented_by_user_id", nullable = false)
    private Long commentedByUserId;

    @Column(name = "comment", nullable = false, length = 2000)
    private String comment;
}
