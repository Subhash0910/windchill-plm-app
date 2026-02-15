package com.windchill.domain.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "folders",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_folder_context_path", columnNames = {"context_id", "path"})
        },
        indexes = {
                @Index(name = "idx_folder_context", columnList = "context_id"),
                @Index(name = "idx_folder_parent", columnList = "parent_id"),
                @Index(name = "idx_folder_path", columnList = "path")
        })
public class Folder extends BaseEntity {

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "path", nullable = false, length = 1024)
    private String path;
}
