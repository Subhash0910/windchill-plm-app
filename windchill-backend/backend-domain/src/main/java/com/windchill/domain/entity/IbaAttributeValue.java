package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * IBA (Inter-Business Attribute) value — stores the actual value of a
 * custom attribute for a specific entity instance.
 *
 * Each row links one attribute definition to one entity ID, storing the
 * value as a String (type coercion is handled by the service layer based
 * on the definition's dataType).
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "iba_attribute_values",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_iba_val_def_entity",
            columnNames = {"definition_id", "entity_id"})
    },
    indexes = {
        @Index(name = "idx_iba_val_entity", columnList = "entity_id"),
        @Index(name = "idx_iba_val_definition", columnList = "definition_id")
    }
)
public class IbaAttributeValue extends BaseEntity {

    /** FK to IbaAttributeDefinition.id */
    @Column(name = "definition_id", nullable = false)
    private Long definitionId;

    /** FK to the entity instance (Part.id, ChangeRequest.id, etc.) */
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    /** The stored value, always as a String. */
    @Column(name = "attribute_value", columnDefinition = "LONGTEXT")
    private String attributeValue;
}
