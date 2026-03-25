package com.windchill.api.change;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
    name = "change_orders",
    uniqueConstraints = @UniqueConstraint(name = "uq_eco_number", columnNames = {"context_id", "eco_number"}),
    indexes = {
        @Index(name = "idx_eco_state",   columnList = "state"),
        @Index(name = "idx_eco_context", columnList = "context_id"),
        @Index(name = "idx_eco_ecr",     columnList = "ecr_id")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChangeOrder {

    public enum State  { DRAFT, OPEN, IN_REVIEW, APPROVED, IMPLEMENTING, COMPLETED, CANCELLED }
    public enum Priority { LOW, MEDIUM, HIGH, CRITICAL }
    public enum ChangeType { ADD, MODIFY, REMOVE, REPLACE }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "eco_number", nullable = false, length = 40)
    private String ecoNumber;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private State state = State.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "ecr_id")
    private Long ecrId;

    @Column(name = "assigned_to", length = 100)
    private String assignedTo;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "ai_risk_score")
    private Double aiRiskScore;

    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @Column(name = "ai_cost_estimate")
    private Double aiCostEstimate;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
