package com.windchill.repository;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PartRepository extends JpaRepository<Part, Long> {
    List<Part> findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(Long contextId);
    Optional<Part> findByContextIdAndPartNumberAndIsLatestTrueAndIsDeletedFalse(Long contextId, String partNumber);
    List<Part> findByMasterIdAndIsDeletedFalseOrderByRevisionAscIterationAsc(Long masterId);
    List<Part> findByLifecycleStateAndIsDeletedFalse(LifecycleStateEnum state);

    List<Part> findByIdInAndIsDeletedFalseOrderByPartNumberAsc(List<Long> ids);
    
    long countByFolderIdAndIsDeletedFalse(Long folderId);
    
    // Search parts by part number (case-insensitive partial match)
    List<Part> findByPartNumberContainingIgnoreCaseAndIsDeletedFalse(String partNumber);
}
