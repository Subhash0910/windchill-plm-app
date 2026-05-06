package com.windchill.repository;

import com.windchill.domain.entity.ClassificationNode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClassificationNodeRepository extends JpaRepository<ClassificationNode, Long> {

    List<ClassificationNode> findByParentIdAndIsDeletedFalseOrderBySortOrderAscNameAsc(Long parentId);

    List<ClassificationNode> findByPathAndIsDeletedFalse(String path);

    List<ClassificationNode> findByNodeTypeAndIsDeletedFalseOrderBySortOrderAscNameAsc(String nodeType);
}
