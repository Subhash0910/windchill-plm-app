package com.windchill.repository;

import com.windchill.domain.entity.AlternatePart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlternatePartRepository extends JpaRepository<AlternatePart, Long> {

    List<AlternatePart> findByOriginalPartIdAndIsDeletedFalseOrderByPriorityAsc(Long originalPartId);

    List<AlternatePart> findByAlternatePartIdAndIsDeletedFalse(Long alternatePartId);
}
