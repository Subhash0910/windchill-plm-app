package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.math.BigDecimal;

@Entity
@Table(name = "baseline_lines", indexes = {
    @Index(name = "idx_bll_baseline", columnList = "baseline_id"),
    @Index(name = "idx_bll_part", columnList = "part_id")
})
@Data @SuperBuilder @NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class BaselineLine extends BaseEntity {

    @Column(name = "baseline_id", nullable = false)
    private Long baselineId;

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "parent_part_id")
    private Long parentPartId;

    @Column(name = "part_number", nullable = false, length = 80)
    private String partNumber;

    @Column(name = "part_name", length = 255)
    private String partName;

    @Column(name = "part_revision", length = 10)
    private String partRevision;

    @Column(precision = 18, scale = 6)
    private BigDecimal quantity;

    @Column(length = 10)
    private String unit;

    @Column(name = "find_number", length = 30)
    private String findNumber;

    @Column(name = "bom_level")
    private Integer bomLevel;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
