package com.windchill.domain.entity;

import com.windchill.common.enums.StatusEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_code", columnList = "product_code", unique = true),
    @Index(name = "idx_product_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Product extends BaseEntity {
    @Column(name = "product_code", nullable = false, unique = true)
    private String productCode;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "VARCHAR(50)")
    private StatusEnum status = StatusEnum.DRAFT;

    @Column(name = "version_number")
    private String versionNumber = "1.0";

    @Column(name = "category")
    private String category;

    @Column(name = "manufacturer")
    private String manufacturer;

    @Column(name = "cost")
    private Double cost;

    @Column(name = "selling_price")
    private Double sellingPrice;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure = "EA";

    @Column(name = "quantity_on_hand")
    private Integer quantityOnHand = 0;

    @Column(name = "reorder_level")
    private Integer reorderLevel = 10;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "maturity_level")
    private String maturityLevel = "NEW";

    @Column(name = "lifecycle_state")
    private String lifecycleState = "DRAFT";
}
