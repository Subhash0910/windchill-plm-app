package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * IBA (Inter-Business Attribute) definition — Windchill soft-type system.
 *
 * Defines custom attributes that can be attached to any entity type
 * (PART, DOCUMENT, ECR, ECO). Each definition specifies the data type,
 * validation rules, and display metadata.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "iba_attribute_definitions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_iba_def_target_name",
            columnNames = {"target_type", "attribute_name"})
    },
    indexes = {
        @Index(name = "idx_iba_def_target_active", columnList = "target_type, is_active"),
        @Index(name = "idx_iba_def_category", columnList = "category")
    }
)
public class IbaAttributeDefinition extends BaseEntity {

    /** Attribute name (camelCase recommended), e.g. "materialGrade", "supplierCode". */
    @Column(name = "attribute_name", nullable = false, length = 80)
    private String attributeName;

    /**
     * Target entity type this attribute applies to.
     * Values: PART, DOCUMENT, ECR, ECO
     */
    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    /**
     * Data type for the attribute value.
     * Values: STRING, INTEGER, DECIMAL, BOOLEAN, DATE, URL
     */
    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType;

    /** Human-readable label for UI forms. */
    @Column(name = "display_name", length = 128)
    private String displayName;

    /** Help text or description shown in tooltips. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /** Default value applied when no value is stored. */
    @Column(name = "default_value", columnDefinition = "TEXT")
    private String defaultValue;

    /** Whether this attribute is required when saving the entity. */
    @Column(name = "is_required")
    private Boolean isRequired = false;

    /** Whether this attribute is indexed for search. */
    @Column(name = "is_searchable")
    private Boolean isSearchable = false;

    /** Regex pattern for value validation. */
    @Column(name = "validation_regex", columnDefinition = "TEXT")
    private String validationRegex;

    /** Minimum value (for numeric/date types). */
    @Column(name = "min_value", length = 100)
    private String minValue;

    /** Maximum value (for numeric/date types). */
    @Column(name = "max_value", length = 100)
    private String maxValue;

    /**
     * Comma-separated list of allowed values for dropdown/select controls.
     * e.g. "Steel,Aluminum,Titanium,Carbon Fiber"
     */
    @Column(name = "option_values", columnDefinition = "TEXT")
    private String optionValues;

    /** Sort order within its category on the UI. */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** Grouping key for organizing attributes in forms, e.g. "materials", "compliance". */
    @Column(name = "category", length = 60)
    private String category;

    /** Soft-toggle for enabling/disabling this attribute definition. */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
