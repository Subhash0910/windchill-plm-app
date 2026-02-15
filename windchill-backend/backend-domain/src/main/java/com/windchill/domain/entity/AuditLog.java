package com.windchill.domain.entity;

import com.windchill.common.enums.PlmEntityTypeEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "audit_logs",
        indexes = {
                @Index(name = "idx_audit_entity", columnList = "entity_type,entity_id"),
                @Index(name = "idx_audit_created", columnList = "created_at")
        })
public class AuditLog extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private PlmEntityTypeEnum entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "action", nullable = false, length = 80)
    private String action;

    @Column(name = "actor", length = 100)
    private String actor;

    @Column(name = "details", columnDefinition = "LONGTEXT")
    private String details;
}
