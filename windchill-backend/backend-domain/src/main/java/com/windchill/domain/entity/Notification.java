package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Notification extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    /** WORKLIST_ASSIGNED | PART_PROMOTED | ECR_SUBMITTED | ECR_REJECTED | SYSTEM | INFO */
    @Column(length = 50)
    private String type;

    /** PART | ECR | WORK_ITEM | SYSTEM */
    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private Long entityId;

    /** Human-readable entity reference, e.g. part number "P001" */
    @Column(name = "entity_number", length = 100)
    private String entityNumber;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        if (type == null) type = "INFO";
    }
}
