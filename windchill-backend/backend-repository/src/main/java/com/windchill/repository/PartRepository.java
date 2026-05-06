package com.windchill.repository;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PartRepository extends JpaRepository<Part, Long>, JpaSpecificationExecutor<Part> {
    List<Part> findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(Long contextId);
    Optional<Part> findByContextIdAndPartNumberAndIsLatestTrueAndIsDeletedFalse(Long contextId, String partNumber);
    List<Part> findByMasterIdAndIsDeletedFalseOrderByRevisionAscIterationAsc(Long masterId);
    List<Part> findByLifecycleStateAndIsDeletedFalse(LifecycleStateEnum state);

    List<Part> findByIdInAndIsDeletedFalseOrderByPartNumberAsc(List<Long> ids);

    long countByFolderIdAndIsDeletedFalse(Long folderId);

    // Search parts by part number (case-insensitive partial match)
    List<Part> findByPartNumberContainingIgnoreCaseAndIsDeletedFalse(String partNumber);

    // Used by undoCheckOut() to find and restore the previous iteration
    Optional<Part> findByMasterIdAndRevisionAndIteration(Long masterId, String revision, Integer iteration);

    // Paginated listing
    Page<Part> findByContextIdAndIsDeletedFalse(Long contextId, Pageable pageable);

    // Global keyword search across partNumber and name
    @Query("SELECT p FROM Part p WHERE p.isDeleted = false AND (LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', :kw, '%'))) ORDER BY p.partNumber ASC")
    List<Part> searchByKeyword(@Param("kw") String keyword);

    // Keyword search scoped to a context
    @Query("SELECT p FROM Part p WHERE p.isDeleted = false AND p.contextId = :ctxId AND (LOWER(p.partNumber) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(p.name) LIKE LOWER(CONCAT('%', :kw, '%'))) ORDER BY p.partNumber ASC")
    List<Part> searchByKeywordInContext(@Param("ctxId") Long contextId, @Param("kw") String keyword);
}
