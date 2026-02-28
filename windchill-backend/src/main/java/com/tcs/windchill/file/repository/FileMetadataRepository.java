package com.tcs.windchill.file.repository;

import com.tcs.windchill.file.model.FileMetadata;
import com.tcs.windchill.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for file metadata
 * 
 * @author Subhash
 */
@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {

    /**
     * Find file by filename (unique)
     */
    Optional<FileMetadata> findByFilename(String filename);

    /**
     * Find files attached to entity
     */
    List<FileMetadata> findByEntityTypeAndEntityIdAndIsDeletedFalseOrderByUploadedAtDesc(
        String entityType, 
        Long entityId
    );

    /**
     * Find files uploaded by user
     */
    Page<FileMetadata> findByUploadedByAndIsDeletedFalseOrderByUploadedAtDesc(
        User user, 
        Pageable pageable
    );

    /**
     * Count files for entity
     */
    @Query("SELECT COUNT(f) FROM FileMetadata f WHERE f.entityType = :entityType AND f.entityId = :entityId AND f.isDeleted = false")
    Long countByEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);

    /**
     * Calculate total storage used by user
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileMetadata f WHERE f.uploadedBy = :user AND f.isDeleted = false")
    Long calculateTotalStorageByUser(@Param("user") User user);

    /**
     * Find files pending virus scan
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.scanStatus = 'PENDING' AND f.isDeleted = false AND f.uploadedAt > :since")
    List<FileMetadata> findPendingScans(@Param("since") LocalDateTime since);

    /**
     * Find infected files
     */
    List<FileMetadata> findByScanStatusAndIsDeletedFalse(ScanStatus scanStatus);

    /**
     * Find duplicate files by checksum
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.checksum = :checksum AND f.isDeleted = false")
    List<FileMetadata> findDuplicatesByChecksum(@Param("checksum") String checksum);
}
