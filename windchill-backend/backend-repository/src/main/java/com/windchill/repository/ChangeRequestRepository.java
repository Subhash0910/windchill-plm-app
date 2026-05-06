package com.windchill.repository;

import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.domain.entity.ChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChangeRequestRepository extends JpaRepository<ChangeRequest, Long> {

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

    /** Next sequence number for generating changeNumber. */
    @Query("SELECT COUNT(cr) FROM ChangeRequest cr")
    long countAll();

    /**
     * Find active change requests (not CLOSED or REJECTED) that have at least one
     * of the given part IDs in their impactedPartIds field.
     * Used by conflict detection in AI impact analysis.
     */
    @Query("SELECT cr FROM ChangeRequest cr WHERE cr.status NOT IN ('CLOSED', 'REJECTED')")
    List<ChangeRequest> findActiveChangeRequests();
}
