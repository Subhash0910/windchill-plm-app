package com.windchill.repository;

import com.windchill.domain.entity.BomLine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BomLineRepository extends JpaRepository<BomLine, Long> {
    List<BomLine> findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(Long parentPartId);
    boolean existsByParentPartIdAndChildPartIdAndIsDeletedFalse(Long parentPartId, Long childPartId);
}
