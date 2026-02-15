package com.windchill.domain.entity;

import com.windchill.common.enums.RoleEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "plm_context_members",
        uniqueConstraints = @UniqueConstraint(name = "uq_ctx_member", columnNames = {"context_id", "user_id"}),
        indexes = {
                @Index(name = "idx_ctx_member_context", columnList = "context_id"),
                @Index(name = "idx_ctx_member_user", columnList = "user_id")
        }
)
public class PlmContextMember extends BaseEntity {

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private RoleEnum role;
}
