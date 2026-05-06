package com.windchill.repository;

import com.windchill.domain.entity.ClassificationAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassificationAttributeRepository extends JpaRepository<ClassificationAttribute, Long> {

    List<ClassificationAttribute> findByNodeIdAndIsDeletedFalseOrderBySortOrderAsc(Long nodeId);
}
