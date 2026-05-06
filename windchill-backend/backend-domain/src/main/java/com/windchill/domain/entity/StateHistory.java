package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Tracks every lifecycle state transition for auditable entities.
 * Mirrors Windchill's full state-history audit trail.
 *
 * Supported entity types: PART, DOCUMENT, CHANGE_REQUEST, CHANGE_ORDER
 * Transitions: PROMOTE, DEMOTE, REVISE, SUBMIT, APPROVE, REJECT, etc.
 */
@Entity
@Table(name = "state_history", indexes = {
    @Index(name = "idx_sh_entity", columnList = "entity_type,entity_id"),
    @Index(name = "idx_sh_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class StateHistory extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // PART, DOCUMENT, CHANGE_REQUEST, CHANGE_ORDER

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "from_state", length = 30)
    private String fromState;

    @Column(name = "to_state", nullable = false, length = 30)
    private String toState;

    @Column(name = "transition", nullable = false, length = 50)
    private String transition; // PROMOTE, DEMOTE, REVISE, SUBMIT, APPROVE, REJECT, etc.

    @Column(name = "actor", length = 100)
    private String actor;

    @Column(length = 500)
    private String comment;
}
