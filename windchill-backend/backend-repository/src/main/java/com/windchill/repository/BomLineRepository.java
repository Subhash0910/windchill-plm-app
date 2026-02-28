package com.windchill.repository;

import com.windchill.domain.entity.BomLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BomLineRepository extends JpaRepository<BomLine, Long> {
    List<BomLine> findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(Long parentPartId);
    boolean existsByParentPartIdAndChildPartIdAndIsDeletedFalse(Long parentPartId, Long childPartId);

    @Query("select distinct b.parentPartId from BomLine b where b.childPartId = :childPartId and b.isDeleted = false")
    List<Long> findDistinctParentPartIdsByChildPartId(@Param("childPartId") Long childPartId);
    
    @Modifying
    @Query("delete from BomLine b where b.parentPartId = :parentPartId")
    void deleteByParentPartId(@Param("parentPartId") Long parentPartId);
}
