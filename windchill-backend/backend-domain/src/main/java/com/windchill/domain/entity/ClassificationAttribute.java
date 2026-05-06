package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "classification_attributes")
public class ClassificationAttribute extends BaseEntity {

    @Column(name = "node_id", nullable = false)
    private Long nodeId;

    @Column(name = "attr_name", nullable = false, length = 255)
    private String attrName;

    /** STRING | NUMBER | BOOLEAN | DATE | OPTION */
    @Column(name = "attr_type", nullable = false, length = 20)
    private String attrType = "STRING";

    @Column(name = "required", nullable = false)
    private Boolean required = false;

    @Column(name = "sort_order")
    private Integer sortOrder;

    /** Comma-separated values for OPTION type */
    @Column(name = "options", length = 1000)
    private String options;

    @Column(name = "default_value", length = 500)
    private String defaultValue;

    /** e.g. "mm", "V", "A" */
    @Column(name = "unit", length = 20)
    private String unit;
}
