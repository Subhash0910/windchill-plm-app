package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "object_templates",
        indexes = {
                @Index(name = "idx_ot_target_type", columnList = "target_type"),
                @Index(name = "idx_ot_public", columnList = "is_public"),
                @Index(name = "idx_ot_owner", columnList = "owner_id")
        })
public class ObjectTemplate extends BaseEntity {

    @Column(name = "template_name", nullable = false, length = 200)
    private String templateName;

    @Column(name = "target_type", nullable = false, length = 50)
    private String targetType;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "template_data", columnDefinition = "TEXT")
    private String templateData;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "category", length = 50)
    private String category;

    @Column(name = "icon_name", length = 100)
    private String iconName;
}
