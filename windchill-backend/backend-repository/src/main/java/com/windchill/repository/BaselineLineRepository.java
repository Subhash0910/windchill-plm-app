package com.windchill.repository;

import com.windchill.domain.entity.BaselineLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BaselineLineRepository extends JpaRepository<BaselineLine, Long> {
    List<BaselineLine> findByBaselineIdOrderByBomLevelAscSortOrderAsc(Long baselineId);
    long countByBaselineId(Long baselineId);
}
