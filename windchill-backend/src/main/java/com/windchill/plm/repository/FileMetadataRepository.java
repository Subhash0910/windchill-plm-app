package com.windchill.plm.repository;

import com.windchill.plm.model.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for FileMetadata entity operations.
 * 
 * @author Subhash
 */
@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {

    /**
     * Find all files for an entity
     */
    List<FileMetadata> findByEntityTypeAndEntityIdAndIsDeletedFalse(String entityType, Long entityId);

    /**
     * Find files uploaded by a user
     */
    List<FileMetadata> findByUploadedByIdAndIsDeletedFalse(Long userId);

    /**
     * Find file by filename
     */
    Optional<FileMetadata> findByFilenameAndIsDeletedFalse(String filename);

    /**
     * Find files by category
     */
    List<FileMetadata> findByEntityTypeAndEntityIdAndCategoryAndIsDeletedFalse(
        String entityType, Long entityId, String category
    );

    /**
     * Count files for an entity
     */
    long countByEntityTypeAndEntityIdAndIsDeletedFalse(String entityType, Long entityId);

    /**
     * Calculate total size of files for an entity
     */
    @Query("SELECT COALESCE(SUM(f.fileSize), 0) FROM FileMetadata f WHERE f.entityType = :entityType AND f.entityId = :entityId AND f.isDeleted = false")
    long sumFileSizeByEntity(@Param("entityType") String entityType, @Param("entityId") Long entityId);
}
