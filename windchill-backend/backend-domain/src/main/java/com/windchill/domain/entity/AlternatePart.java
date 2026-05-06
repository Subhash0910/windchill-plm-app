package com.windchill.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * AlternatePart — defines substitute parts that can replace an original part
 * in an assembly, with priority ordering and quantity scaling.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "alternate_parts",
        indexes = {
                @Index(name = "idx_ap_original", columnList = "original_part_id"),
                @Index(name = "idx_ap_alternate", columnList = "alternate_part_id")
        })
public class AlternatePart extends BaseEntity {

    @Column(name = "original_part_id", nullable = false)
    private Long originalPartId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_part_id", insertable = false, updatable = false)
    private Part originalPart;

    @Column(name = "alternate_part_id", nullable = false)
    private Long alternatePartId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alternate_part_id", insertable = false, updatable = false)
    private Part alternatePart;

    @Column(nullable = false)
    private Integer priority = 1;

    @Column(precision = 18, scale = 6)
    private BigDecimal quantityFactor = BigDecimal.ONE;

    @Column(length = 500)
    private String substitutionCondition;

    @Column(name = "is_two_way", nullable = false)
    private Boolean isTwoWay = false;
}
