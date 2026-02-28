package com.windchill.plm.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * File metadata entity for tracking uploaded files.
 * Supports both S3 and local storage.
 * 
 * @author Subhash
 * @version 2.0
 */
@Entity
@Table(name = "file_metadata", indexes = {
    @Index(name = "idx_entity", columnList = "entity_type,entity_id"),
    @Index(name = "idx_uploader", columnList = "uploaded_by"),
    @Index(name = "idx_storage", columnList = "storage_type,storage_path")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Generated unique filename (UUID-based)
     */
    @Column(name = "filename", nullable = false)
    private String filename;

    /**
     * Original filename uploaded by user
     */
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    /**
     * MIME content type (image/png, application/pdf, etc.)
     */
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /**
     * File size in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Storage path (S3 key or local filesystem path)
     */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    /**
     * Storage type: S3 or LOCAL
     */
    @Column(name = "storage_type", nullable = false, length = 20)
    @Builder.Default
    private String storageType = "LOCAL";

    /**
     * Type of entity this file is attached to
     * ECN, PART, ECR, COMMENT, etc.
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /**
     * ID of the entity this file is attached to
     */
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    /**
     * User who uploaded the file
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    /**
     * When file was uploaded
     */
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant uploadedAt = Instant.now();

    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * SHA-256 checksum for file integrity verification
     */
    @Column(name = "checksum", length = 64)
    private String checksum;

    /**
     * File description (optional)
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Category/tag for file organization
     */
    @Column(name = "category", length = 50)
    private String category;

    /**
     * Soft delete the file
     */
    public void softDelete() {
        this.isDeleted = true;
    }

    /**
     * Get human-readable file size
     */
    public String getHumanReadableSize() {
        if (fileSize == null) return "0 B";
        
        long size = fileSize;
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.1f MB", size / (1024.0 * 1024));
        return String.format("%.1f GB", size / (1024.0 * 1024 * 1024));
    }

    /**
     * Get file extension
     */
    public String getFileExtension() {
        if (originalFilename == null) return "";
        int lastDot = originalFilename.lastIndexOf('.');
        return lastDot > 0 ? originalFilename.substring(lastDot + 1).toLowerCase() : "";
    }

    /**
     * Check if file is an image
     */
    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    /**
     * Check if file is a PDF
     */
    public boolean isPdf() {
        return "application/pdf".equals(contentType);
    }
}
