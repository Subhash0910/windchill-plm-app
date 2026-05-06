package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Windchill Action Framework — RegisteredAction.
 *
 * Every button, menu item, toolbar action is a RegisteredAction with
 * optional enabled/visible Spring EL expressions, a handler class,
 * and category-based grouping.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "registered_actions",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_action_name", columnNames = "action_name")
    },
    indexes = {
        @Index(name = "idx_action_target_type", columnList = "target_type"),
        @Index(name = "idx_action_category", columnList = "category"),
        @Index(name = "idx_action_type", columnList = "action_type")
    }
)
public class RegisteredAction extends BaseEntity {

    /** Unique action identifier, e.g. "PART_CREATE", "ECR_APPROVE". */
    @Column(name = "action_name", nullable = false, unique = true, length = 80)
    private String actionName;

    /** Human-readable label, e.g. "Create Part", "Promote to Under Review". */
    @Column(name = "display_name", length = 128)
    private String displayName;

    /** Longer description shown in tooltips or help. */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Where this action appears.
     * Values: TOOLBAR, MENU, CONTEXT_MENU, WIZARD, TAB
     */
    @Column(name = "action_type", length = 30)
    private String actionType;

    /**
     * What entity type this action operates on.
     * Values: PART, DOCUMENT, ECR, ECO, BOM, FOLDER, GLOBAL
     */
    @Column(name = "target_type", length = 30)
    private String targetType;

    /** Icon name or emoji for the action button. */
    @Column(name = "icon", length = 80)
    private String icon;

    /**
     * Spring EL expression that evaluates whether the action is available.
     * e.g. "part.lifecycleState != 'OBSOLETE'"
     */
    @Column(name = "enabled_expression", columnDefinition = "TEXT")
    private String enabledExpression;

    /**
     * Spring EL expression that evaluates whether the action is visible.
     */
    @Column(name = "visible_expression", columnDefinition = "TEXT")
    private String visibleExpression;

    /** Fully qualified class name of the ActionHandler implementation. */
    @Column(name = "handler_class", length = 255)
    private String handlerClass;

    /** Sort order within its category (lower = first). */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** Grouping key for menus and toolbars, e.g. "lifecycle", "files", "tools". */
    @Column(name = "category", length = 60)
    private String category;
}
