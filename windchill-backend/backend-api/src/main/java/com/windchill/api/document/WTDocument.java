package com.windchill.api.document;

import com.windchill.api.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "wt_documents",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_doc_ctx_number_rev_iter",
        columnNames = {"context_id", "doc_number", "revision", "iteration"}
    ),
    indexes = {
        @Index(name = "idx_doc_context", columnList = "context_id"),
        @Index(name = "idx_doc_master",  columnList = "master_id"),
        @Index(name = "idx_doc_folder",  columnList = "folder_id"),
        @Index(name = "idx_doc_state",   columnList = "lifecycle_state"),
        @Index(name = "idx_doc_type",    columnList = "doc_type"),
        @Index(name = "idx_doc_latest",  columnList = "is_latest")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WTDocument extends BaseEntity {

    @Column(name = "context_id", nullable = false)
    private Long contextId;

    @Column(name = "folder_id")
    private Long folderId;

    @Column(name = "master_id")
    private Long masterId;

    @Column(name = "doc_number", nullable = false, length = 80)
    private String docNumber;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    /** SPEC | DRAWING | PROCEDURE | REPORT */
    @Column(name = "doc_type", nullable = false, length = 20)
    private String docType = "SPEC";

    @Column(name = "lifecycle_state", nullable = false, length = 20)
    private String lifecycleState = "INWORK";

    @Column(name = "revision", nullable = false, length = 10)
    private String revision = "A";

    @Column(name = "iteration", nullable = false)
    private Integer iteration = 1;

    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest = true;

    @Column(name = "checked_out_by", length = 100)
    private String checkedOutBy;

    // ---- file attachment metadata (stored separately, path only) ----
    @Column(name = "file_name", length = 512)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 120)
    private String mimeType;

    @Column(name = "storage_path", length = 1024)
    private String storagePath;

    @Version
    @Column(name = "version")
    private Long version;
}
