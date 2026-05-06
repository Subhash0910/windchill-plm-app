package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Entity
@Table(name = "baselines", indexes = {
    @Index(name = "idx_bl_context", columnList = "context_id"),
    @Index(name = "idx_bl_part", columnList = "part_id"),
    @Index(name = "idx_bl_created", columnList = "created_at")
})
@Data @SuperBuilder @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Baseline extends BaseEntity {

    @Column(nullable = false, length = 80)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "part_number", length = 80)
    private String partNumber;

    @Column(name = "part_name", length = 255)
    private String partName;

    @Column(name = "part_revision", length = 10)
    private String partRevision;

    @Column(name = "baseline_type", length = 30)
    private String baselineType = "PRODUCT";

    @Column(name = "is_frozen", nullable = false)
    private Boolean isFrozen = false;

    @Column(name = "frozen_at")
    private LocalDateTime frozenAt;

    @Column(name = "frozen_by", length = 100)
    private String frozenBy;

    @Column(name = "total_lines")
    private Integer totalLines;
}
