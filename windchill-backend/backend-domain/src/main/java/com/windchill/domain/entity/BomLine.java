package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "bom_lines",
        indexes = {
                @Index(name = "idx_bom_parent", columnList = "parent_part_id"),
                @Index(name = "idx_bom_child", columnList = "child_part_id")
        })
public class BomLine extends BaseEntity {

    @Column(name = "parent_part_id", nullable = false)
    private Long parentPartId;

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
}
