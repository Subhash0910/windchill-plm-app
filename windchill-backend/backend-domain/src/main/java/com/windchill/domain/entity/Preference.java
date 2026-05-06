package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "preferences",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_pref_key_scope_scopeid",
                        columnNames = {"pref_key", "scope", "scope_id"})
        },
        indexes = {
                @Index(name = "idx_pref_category", columnList = "category"),
                @Index(name = "idx_pref_scope", columnList = "scope, scope_id")
        })
public class Preference extends BaseEntity {

    @Column(name = "pref_key", nullable = false, length = 100)
    private String prefKey;

    @Column(name = "pref_value", nullable = false, length = 500)
    private String prefValue;

    @Column(name = "pref_type", length = 20)
    private String prefType = "STRING";

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "scope", nullable = false, length = 20)
    private String scope;

    @Column(name = "scope_id")
    private Long scopeId;

    @Column(name = "display_name", length = 200)
    private String displayName;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "is_encrypted", nullable = false)
    private Boolean isEncrypted = false;
}
