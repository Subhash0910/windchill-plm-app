package com.tcs.windchill.file.model;

import com.tcs.windchill.user.model.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * File metadata entity - Tracks uploaded files
 * 
 * Supports attachments for:
 * - ECN documents
 * - Part CAD files
 * - ECR justifications
 * - User profile pictures
 * 
 * @author Subhash
 */
@Entity
@Table(name = "file_metadata", indexes = {
    @Index(name = "idx_entity", columnList = "entity_type,entity_id"),
    @Index(name = "idx_uploader", columnList = "uploaded_by"),
    @Index(name = "idx_checksum", columnList = "checksum")
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
     * Generated filename (UUID-based for uniqueness)
     */
    @Column(name = "filename", nullable = false, unique = true)
    private String filename;

    /**
     * Original filename uploaded by user
     */
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    /**
     * MIME type
     */
    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    /**
     * File size in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Storage path (S3 key or filesystem path)
     */
    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    /**
     * Storage type
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "storage_type", nullable = false, length = 20)
    private StorageType storageType;

    /**
     * Entity this file is attached to
     */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // ECN, PART, ECR, USER

    /**
     * Entity ID
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
     * Upload timestamp
     */
    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    /**
     * SHA-256 checksum for integrity verification
     */
    @Column(name = "checksum", length = 64)
    private String checksum;

    /**
     * Virus scan status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "scan_status", length = 20)
    @Builder.Default
    private ScanStatus scanStatus = ScanStatus.PENDING;

    /**
     * Soft delete flag
     */
    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    /**
     * Deletion timestamp
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * File description/notes
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Mark file as deleted (soft delete)
     */
    public void markDeleted() {
        this.isDeleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Check if file is image
     */
    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    /**
     * Check if file is document
     */
    public boolean isDocument() {
        return contentType != null && (
            contentType.contains("pdf") ||
            contentType.contains("word") ||
            contentType.contains("document") ||
            contentType.contains("spreadsheet")
        );
    }

    /**
     * Get human-readable file size
     */
    public String getFormattedSize() {
        if (fileSize < 1024) return fileSize + " B";
        if (fileSize < 1024 * 1024) return String.format("%.1f KB", fileSize / 1024.0);
        if (fileSize < 1024 * 1024 * 1024) return String.format("%.1f MB", fileSize / (1024.0 * 1024));
        return String.format("%.1f GB", fileSize / (1024.0 * 1024 * 1024));
    }
}

/**
 * Storage types
 */
enum StorageType {
    S3,      // AWS S3 or compatible (MinIO, etc.)
    LOCAL    // Local filesystem
}

/**
 * Virus scan status
 */
enum ScanStatus {
    PENDING,   // Not scanned yet
    CLEAN,     // No virus detected
    INFECTED,  // Virus detected
    SKIPPED    // Scan skipped (disabled)
}
