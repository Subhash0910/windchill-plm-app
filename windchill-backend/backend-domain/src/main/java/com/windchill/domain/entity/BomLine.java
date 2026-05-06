package com.windchill.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.windchill.common.enums.EffectivityType;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "bom_lines",
        indexes = {
                @Index(name = "idx_bom_parent", columnList = "parent_part_id"),
                @Index(name = "idx_bom_child", columnList = "child_part_id")
        })
public class BomLine extends BaseEntity {

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_part_id", insertable = false, updatable = false)
    private Part parentPart;

    @Column(name = "parent_part_id", nullable = false)
    private Long parentPartId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "child_part_id", insertable = false, updatable = false)
    private Part childPart;

    @Column(name = "child_part_id", nullable = false)
    private Long childPartId;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 6)
    private BigDecimal quantity = BigDecimal.ONE;

    @Column(name = "unit", nullable = false, length = 10)
    private String unit = "EA";

    @Column(name = "find_number", length = 30)
    private String findNumber;

    @Column(name = "line_note", length = 500)
    private String lineNote;

    @Column(name = "sort_order")
    private Integer sortOrder;

    // ─── Effectivity fields ─────────────────────────────────────────────────

    @Column(name = "effectivity_start_date")
    private LocalDate effectivityStartDate;

    @Column(name = "effectivity_end_date")
    private LocalDate effectivityEndDate;

    @Column(name = "effectivity_start_serial", length = 50)
    private String effectivityStartSerial;

    @Column(name = "effectivity_end_serial", length = 50)
    private String effectivityEndSerial;

    @Column(name = "effectivity_lot", length = 50)
    private String effectivityLot;

    @Enumerated(EnumType.STRING)
    @Column(name = "effectivity_type", length = 20)
    private EffectivityType effectivityType = EffectivityType.ALL;

    @Column(name = "reference_designator", length = 100)
    private String referenceDesignator;
}
