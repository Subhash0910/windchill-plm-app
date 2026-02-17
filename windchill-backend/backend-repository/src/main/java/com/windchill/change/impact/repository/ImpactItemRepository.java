package com.windchill.change.impact.repository;

import com.windchill.change.impact.domain.ImpactItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ImpactItemRepository extends JpaRepository<ImpactItem, Long> {
    List<ImpactItem> findByReportIdOrderByDepthAscIdAsc(Long reportId);
}
