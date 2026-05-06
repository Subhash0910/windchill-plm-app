package com.windchill.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * Windchill-style object-level ACL rule stored as data.
 *
 * Maps to the "access_control_rules" table. Each row defines whether a
 * principal (user, role, group, or ALL) is allowed or denied a specific
 * permission on a specific target type (and optionally a specific target ID).
 *
 * Evaluation follows Windchill semantics:
 *   1. Gather all rules matching (targetType, targetId) OR (targetType, null).
 *   2. Match against user's ID + roles + "ALL" principalType.
 *   3. Sort by priority DESC — deny rules should carry higher priority.
 *   4. First matching rule wins.
 *   5. No match = default DENY.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "access_control_rules",
       indexes = {
           @Index(name = "idx_acl_target", columnList = "targetType,targetId"),
           @Index(name = "idx_acl_principal", columnList = "principalType,principalId"),
           @Index(name = "idx_acl_target_type", columnList = "targetType")
       })
public class AccessControlRule extends BaseEntity {

    /** "USER", "ROLE", "GROUP", "ALL" */
    @Column(name = "principal_type", nullable = false, length = 20)
    private String principalType;

    /** User ID when principalType = USER; null otherwise. */
    @Column(name = "principal_id")
    private Long principalId;

    /** Role name when principalType = ROLE; username when USER; group name when GROUP. */
    @Column(name = "principal_name", length = 100)
    private String principalName;

    /** "PART", "DOCUMENT", "ECR", "ECO", "FOLDER", "CONTEXT", "GLOBAL" */
    @Column(name = "target_type", nullable = false, length = 20)
    private String targetType;

    /** Specific object ID, or null = all objects of targetType (global rule). */
    @Column(name = "target_id")
    private Long targetId;

    /** "READ", "MODIFY", "DELETE", "CREATE", "PROMOTE", "REVISE", "ADMIN", "CHECKOUT", "DOWNLOAD" */
    @Column(name = "permission", nullable = false, length = 30)
    private String permission;

    /** true = allow, false = deny */
    @Column(name = "is_allowed", nullable = false)
    private Boolean isAllowed = true;

    /** Higher = evaluated first. Deny rules typically have higher priority. */
    @Column(name = "priority", nullable = false)
    private Integer priority = 0;

    /** "OBJECT", "CONTAINER", "CONTEXT", "GLOBAL" */
    @Column(name = "scope", nullable = false, length = 20)
    private String scope = "OBJECT";
}
