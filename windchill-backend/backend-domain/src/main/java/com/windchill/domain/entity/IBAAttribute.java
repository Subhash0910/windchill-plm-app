package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "iba_attributes",
    indexes = {
        @Index(name = "idx_iba_part", columnList = "part_id"),
        @Index(name = "idx_iba_name", columnList = "attribute_name")
    })
public class IBAAttribute extends BaseEntity {

    @Column(name = "part_id", nullable = false)
    private Long partId;

    @Column(name = "attribute_name", nullable = false, length = 100)
    private String attributeName;

    @Column(name = "attribute_value", length = 500)
    private String attributeValue;

    // STRING | INTEGER | FLOAT | BOOLEAN | DATE | URL
    @Column(name = "attribute_type", length = 50)
    private String attributeType = "STRING";

    @Column(name = "unit", length = 30)
    private String unit;

    @Column(name = "description", length = 255)
    private String description;
}
