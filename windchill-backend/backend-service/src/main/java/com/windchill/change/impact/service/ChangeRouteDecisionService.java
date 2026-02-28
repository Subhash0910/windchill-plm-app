package com.windchill.change.impact.service;

import com.windchill.change.domain.ChangeTaskType;
import com.windchill.change.impact.domain.ImpactReport;
import com.windchill.change.impact.domain.ImpactRouteDecision;
import com.windchill.change.impact.domain.ImpactRiskLevel;
import com.windchill.change.impact.repository.ImpactRouteDecisionRepository;
import com.windchill.change.repository.ChangeTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class ChangeRouteDecisionService {

    private final ImpactRouteDecisionRepository impactRouteDecisionRepository;
    private final ChangeImpactRoutingPolicy changeImpactRoutingPolicy;
    private final ChangeTaskRepository changeTaskRepository;

    public ChangeRouteDecisionService(ImpactRouteDecisionRepository impactRouteDecisionRepository,
                                     ChangeImpactRoutingPolicy changeImpactRoutingPolicy,
                                     ChangeTaskRepository changeTaskRepository) {
        this.impactRouteDecisionRepository = impactRouteDecisionRepository;
        this.changeImpactRoutingPolicy = changeImpactRoutingPolicy;
        this.changeTaskRepository = changeTaskRepository;
    }

    @Transactional
    public RouteDecisionResult applyRouting(Long ecrId, ImpactReport report, List<String> requestedReviewers) {
        List<String> requested = normalize(requestedReviewers);
        List<String> added = new ArrayList<>();
        String rulesJson = "[]";
        String explanation = "";

        if (report.getRiskLevel() == ImpactRiskLevel.HIGH) {
            rulesJson = "[\"RISK_HIGH_ADD_SENIOR_REVIEWERS\"]";
            explanation = "Risk is HIGH; additional senior reviewers were added.";

            for (String sr : changeImpactRoutingPolicy.getSeniorReviewers()) {
                if (sr == null || sr.isBlank()) continue;

                boolean exists = changeTaskRepository.existsByChangeRequestIdAndTypeAndAssignee(ecrId, ChangeTaskType.REVIEW, sr);
                if (!exists) {
                    added.add(sr);
                }
            }
        } else if (report.getRiskLevel() == ImpactRiskLevel.MEDIUM) {
            rulesJson = "[\"RISK_MEDIUM_NO_AUTO_ADD\"]";
            explanation = "Risk is MEDIUM; no extra routing rules applied.";
        } else {
            rulesJson = "[\"RISK_LOW_NO_AUTO_ADD\"]";
            explanation = "Risk is LOW; no extra routing rules applied.";
        }

        ImpactRouteDecision d = new ImpactRouteDecision();
        d.setReportId(report.getId());
        d.setEcrId(ecrId);
        d.setRiskLevel(report.getRiskLevel().name());
        d.setRequestedReviewersCsv(String.join(",", requested));
        d.setAddedReviewersCsv(String.join(",", added));
        d.setAppliedRulesJson(rulesJson);
        d.setExplanation(explanation);
        impactRouteDecisionRepository.save(d);

        return new RouteDecisionResult(added, d);
    }

    private List<String> normalize(List<String> reviewers) {
        if (reviewers == null || reviewers.isEmpty()) return List.of();
        Set<String> set = new LinkedHashSet<>();
        for (String r : reviewers) {
            if (r == null) continue;
            String t = r.trim();
            if (!t.isEmpty()) set.add(t);
        }
        return new ArrayList<>(set);
    }

    public record RouteDecisionResult(List<String> reviewersToAdd, ImpactRouteDecision decision) {
    }
}
