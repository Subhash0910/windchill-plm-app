package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    /**
     * @Builder.Default is required here.
     * Without it, Lombok's builder ignores the `= false` initialiser
     * entirely and the field is set to Java's primitive default (false),
     * which happens to be the same value BUT only by coincidence.
     * Adding @Builder.Default makes the intent explicit and eliminates
     * the Lombok compiler warning seen in Docker build output.
     */
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (type == null)      type      = "INFO";
    }
}
