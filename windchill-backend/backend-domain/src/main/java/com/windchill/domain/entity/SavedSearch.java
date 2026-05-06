package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
    name = "saved_searches",
    indexes = {
        @Index(name = "idx_ss_user", columnList = "user_id"),
        @Index(name = "idx_ss_entity_type_public", columnList = "entity_type, is_public")
    }
)
public class SavedSearch extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "entity_type", nullable = false, length = 20)
    private String entityType;

    @Column(name = "query_json", columnDefinition = "TEXT")
    private String queryJson;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;

    @Column(name = "sort_by", length = 50)
    private String sortBy;

    @Column(name = "sort_dir", length = 10)
    private String sortDir;
}
