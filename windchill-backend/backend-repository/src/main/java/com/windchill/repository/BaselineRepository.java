package com.windchill.repository;

import com.windchill.domain.entity.Baseline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BaselineRepository extends JpaRepository<Baseline, Long> {

    List<Baseline> findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(Long contextId);

    List<Baseline> findByPartIdAndIsDeletedFalseOrderByCreatedAtDesc(Long partId);

    List<Baseline> findByIsFrozenAndIsDeletedFalse(Boolean isFrozen);

    List<Baseline> findByContextIdAndPartIdAndIsDeletedFalseOrderByCreatedAtDesc(Long contextId, Long partId);
}
