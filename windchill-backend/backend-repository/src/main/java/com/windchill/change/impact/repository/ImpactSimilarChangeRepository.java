package com.windchill.change.impact.repository;

import com.windchill.change.impact.domain.ImpactSimilarChange;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImpactSimilarChangeRepository extends JpaRepository<ImpactSimilarChange, Long> {
    List<ImpactSimilarChange> findByReportIdOrderByScoreDescIdAsc(Long reportId);
    boolean existsByReportId(Long reportId);
}
