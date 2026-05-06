package com.windchill.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.windchill.common.enums.LifecycleStateEnum;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "parts",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_part_ctx_number_rev_iter",
                        columnNames = {"context_id", "part_number", "revision", "iteration"})
        },
        indexes = {
                @Index(name = "idx_part_context", columnList = "context_id"),
                @Index(name = "idx_part_master", columnList = "master_id"),
                @Index(name = "idx_part_folder", columnList = "folder_id"),
                @Index(name = "idx_part_state", columnList = "lifecycle_state"),
                @Index(name = "idx_part_latest", columnList = "is_latest")
        })
public class Part extends BaseEntity {

    @Column(name = "master_id")
    private Long masterId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_id", insertable = false, updatable = false)
    private PartMaster master;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_id", insertable = false, updatable = false)
    private PlmContext context;

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", insertable = false, updatable = false)
    private Folder folder;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "part_number", nullable = false, length = 80)
    private String partNumber;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "lifecycle_state", nullable = false, length = 20)
    private LifecycleStateEnum lifecycleState = LifecycleStateEnum.INWORK;

    @Column(name = "revision", nullable = false, length = 10)
    private String revision = "A";

    @Column(name = "iteration", nullable = false)
    private Integer iteration = 1;

    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest = true;

    @Column(name = "checked_out_by", length = 100)
    private String checkedOutBy;
}
