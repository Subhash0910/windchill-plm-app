package com.windchill.repository;

import com.windchill.domain.entity.PartClassification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PartClassificationRepository extends JpaRepository<PartClassification, Long> {

    List<PartClassification> findByPartIdAndIsDeletedFalse(Long partId);

    List<PartClassification> findByPartIdAndNodeIdAndIsDeletedFalse(Long partId, Long nodeId);
}
