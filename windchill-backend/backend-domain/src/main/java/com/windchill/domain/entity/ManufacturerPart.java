package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * ManufacturerPart (AML — Approved Manufacturer List) — tracks which manufacturers
 * can supply a given part, including cost, lead time, and qualification status.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "manufacturer_parts",
        indexes = {
                @Index(name = "idx_mp_part", columnList = "part_id"),
                @Index(name = "idx_mp_manufacturer", columnList = "manufacturer_name")
        })
public class ManufacturerPart extends BaseEntity {

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "manufacturer_name", nullable = false, length = 200)
    private String manufacturerName;

    @Column(name = "manufacturer_part_number", nullable = false, length = 100)
    private String manufacturerPartNumber;

    @Column(length = 100)
    private String supplierName;

    @Column(precision = 15, scale = 4)
    private BigDecimal unitCost;

    @Column(length = 10)
    private String currency = "USD";

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "is_preferred", nullable = false)
    private Boolean isPreferred = false;

    @Column(name = "is_qualified", nullable = false)
    private Boolean isQualified = true;

    @Column(name = "qualification_status", length = 30)
    private String qualificationStatus = "APPROVED";

    @Column(name = "minimum_order_qty")
    private Integer minimumOrderQty;

    @Column(name = "packaging_qty")
    private Integer packagingQty;
}
