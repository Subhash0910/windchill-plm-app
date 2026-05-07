package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Windchill-style action model registration.
 * In PTC Windchill these are defined in codebase/config/actions/*.xml
 * and registered as form processors. This entity is the database-driven
 * equivalent — one row per registered action per object type.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@Entity
@Table(name = "action_models",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_action_type_name", columnNames = {"object_type", "action_name"})
    },
    indexes = {
        @Index(name = "idx_action_type", columnList = "object_type"),
        @Index(name = "idx_action_enabled", columnList = "is_enabled")
    })
public class ActionModel extends BaseEntity {

    // ── Object binding ────────────────────────────────────────────────────
    @Column(name = "object_type", nullable = false, length = 30)
    private String objectType;           // PART | ECR | ECO | DOCUMENT | WORKITEM

    @Column(name = "action_name", nullable = false, length = 80)
    private String actionName;           // unique per objectType: "checkout", "promote", "revise"

    // ── Display ───────────────────────────────────────────────────────────
    @Column(name = "label", nullable = false, length = 100)
    private String label;                // "Check Out"

    @Column(name = "icon", length = 20)
    private String icon = "⚡";          // emoji or icon code

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "action_group", length = 50)
    private String actionGroup;          // "checkout-group" | "lifecycle-group"

    // ── Form Processor (Windchill concept) ────────────────────────────────
    @Column(name = "processor_class", length = 200)
    private String processorClass;       // "com.windchill.service.plm.PartServiceImpl"

    @Column(name = "processor_method", length = 100)
    private String processorMethod;      // "checkOut"

    @Column(name = "endpoint", length = 300)
    private String endpoint;             // "/api/v1/plm/parts/{id}/checkout"

    @Column(name = "http_method", length = 10)
    private String httpMethod = "POST";  // GET | POST | PUT | DELETE | PATCH

    // ── Authorization ─────────────────────────────────────────────────────
    @Column(name = "min_role", length = 30)
    private String minRole = "ENGINEER"; // VIEWER | ENGINEER | MANAGER | ADMIN

    // ── Toolbar placement ─────────────────────────────────────────────────
    @Column(name = "toolbar_section", length = 20)
    private String toolbarSection = "PRIMARY"; // PRIMARY | SECONDARY | OVERFLOW

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    // ── Visibility conditions ─────────────────────────────────────────────
    @Column(name = "enabled_states", length = 200)
    private String enabledStates;        // "INWORK,UNDERREVIEW" — null = all states

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    // ── XML customization ─────────────────────────────────────────────────
    @Column(name = "custom_xml", columnDefinition = "TEXT")
    private String customXml;            // optional override XML snippet
}
