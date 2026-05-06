package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "change_tasks", indexes = {
    @Index(name = "idx_ct_change_order", columnList = "change_order_id"),
    @Index(name = "idx_ct_assignee", columnList = "assignee_user_id"),
    @Index(name = "idx_ct_status", columnList = "status")
})
@Data @SuperBuilder @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ChangeTask extends BaseEntity {

    public enum TaskStatus { PENDING, IN_PROGRESS, COMPLETED, CANCELLED }
    public enum TaskPriority { LOW, MEDIUM, HIGH, CRITICAL }

    @Column(name = "change_order_id", nullable = false)
    private Long changeOrderId;

    @Column(name = "task_number", nullable = false, length = 30)
    private String taskNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "assignee_user_id")
    private Long assigneeUserId;

    @Column(name = "assigned_by", length = 100)
    private String assignedBy;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "completed_by", length = 100)
    private String completedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskPriority priority = TaskPriority.MEDIUM;

    @Column(name = "estimated_hours")
    private Double estimatedHours;

    @Column(name = "actual_hours")
    private Double actualHours;

    @Column(length = 500)
    private String comment;

    @Column(name = "affected_part_id")
    private Long affectedPartId;

    @Column(name = "affected_doc_id")
    private Long affectedDocId;
}
