package com.windchill.domain.entity;

import com.windchill.common.enums.StatusEnum;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "documents", indexes = {
    @Index(name = "idx_doc_number", columnList = "document_number", unique = true),
    @Index(name = "idx_doc_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Document extends BaseEntity {
    @Column(name = "document_number", nullable = false, unique = true)
    private String documentNumber;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "document_type")
    private String documentType; // e.g., "SPEC", "DRAWING", "MANUAL"

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StatusEnum status = StatusEnum.DRAFT;

    @Column(name = "version_number")
    private String versionNumber = "1.0";

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "file_name")
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type")
    private String mimeType;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "related_product_id")
    private Long relatedProductId;

    @Column(name = "approval_status")
    private String approvalStatus = "PENDING";

    @Column(name = "reviewer_id")
    private Long reviewerId;
}
