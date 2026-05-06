package com.windchill.repository;

import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.domain.entity.ChangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long>, JpaSpecificationExecutor<ChangeRequest> {

    List<ChangeRequest> findByContextIdOrderByCreatedAtDesc(Long contextId);

    List<ChangeRequest> findByStatusOrderByCreatedAtDesc(ChangeRequestStatus status);

    List<ChangeRequest> findByContextIdAndStatusOrderByCreatedAtDesc(Long contextId, ChangeRequestStatus status);

    List<ChangeRequest> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    Optional<ChangeRequest> findByChangeNumber(String changeNumber);

    /** Count of open ECRs (not CLOSED) per context — used by dashboard. */
    @Query("SELECT COUNT(cr) FROM ChangeRequest cr WHERE cr.contextId = :contextId AND cr.status <> 'CLOSED'")
    long countOpenByContextId(@Param("contextId") Long contextId);

    /** Find all ECRs that reference a given part in their impactedPartIds list. */
    @Query("SELECT cr FROM ChangeRequest cr WHERE cr.impactedPartIds LIKE %:partId%")
    List<ChangeRequest> findByImpactedPartId(@Param("partId") String partId);

    /** Paginated listing — non-deleted, within a context. */
    Page<ChangeRequest> findByContextIdAndIsDeletedFalse(Long contextId, Pageable pageable);

    /** Next sequence number for generating changeNumber. */
    @Query("SELECT COUNT(cr) FROM ChangeRequest cr")
    long countAll();

    // Global keyword search across changeNumber and title
    @Query("SELECT cr FROM ChangeRequest cr WHERE cr.isDeleted = false AND (LOWER(cr.changeNumber) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(cr.title) LIKE LOWER(CONCAT('%', :kw, '%'))) ORDER BY cr.createdAt DESC")
    List<ChangeRequest> searchByKeyword(@Param("kw") String keyword);

    // Keyword search scoped to a context
    @Query("SELECT cr FROM ChangeRequest cr WHERE cr.isDeleted = false AND cr.contextId = :ctxId AND (LOWER(cr.changeNumber) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(cr.title) LIKE LOWER(CONCAT('%', :kw, '%'))) ORDER BY cr.createdAt DESC")
    List<ChangeRequest> searchByKeywordInContext(@Param("ctxId") Long contextId, @Param("kw") String keyword);
}
