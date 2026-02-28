package com.windchill.change.impact.repository;

import com.windchill.change.impact.domain.ImpactReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImpactReportRepository extends JpaRepository<ImpactReport, Long> {
    Optional<ImpactReport> findTopByEcrIdOrderByCreatedAtDesc(Long ecrId);
}
