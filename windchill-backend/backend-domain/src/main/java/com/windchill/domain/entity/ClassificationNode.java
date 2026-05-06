package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(
        name = "classification_nodes",
        indexes = {
                @Index(name = "idx_cn_parent", columnList = "parent_id"),
                @Index(name = "idx_cn_path", columnList = "path")
        }
)
public class ClassificationNode extends BaseEntity {

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "path", nullable = false, length = 500)
    private String path;

    /** "FOLDER" or "LEAF" */
    @Column(name = "node_type", nullable = false, length = 20)
    private String nodeType = "FOLDER";

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "icon", length = 100)
    private String icon;
}
