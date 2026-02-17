package com.windchill.change.impact.repository;

import com.windchill.change.impact.domain.ImpactRouteDecision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ImpactRouteDecisionRepository extends JpaRepository<ImpactRouteDecision, Long> {
    Optional<ImpactRouteDecision> findTopByEcrIdOrderByCreatedAtDesc(Long ecrId);
    Optional<ImpactRouteDecision> findTopByReportIdOrderByCreatedAtDesc(Long reportId);
}
