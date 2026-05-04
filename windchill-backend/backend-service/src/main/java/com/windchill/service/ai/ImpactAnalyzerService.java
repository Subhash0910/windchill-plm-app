package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.Part;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ImpactAnalyzerService {

    private final GraphAnalysisService graphAnalysisService;
    private final MLServiceClient mlServiceClient;
    private final PartRepository partRepository;

    @Transactional(readOnly = true)
    public ImpactAnalysisResponse analyzeChange(ImpactAnalysisRequest request) {
        log.info("Starting impact analysis: partId={}, changeType={}", request.getPartId(), request.getChangeType());
        try {
            Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("Part not found"));

            GraphImpactResult graphResult = graphAnalysisService.analyzePartChange(
                request.getPartId(), request.getChangeType());

            RiskPredictionResponse riskPrediction = getRiskPrediction(request, part, graphResult);

            List<String> warnings        = generateWarnings(graphResult, part);
            List<String> recommendations = generateRecommendations(graphResult, riskPrediction);
            List<String> blockers        = generateBlockers(graphResult);

            ImpactAnalysisResponse response = ImpactAnalysisResponse.builder()
                .partId(part.getId())
                .partNumber(part.getPartNumber())
                .changeType(request.getChangeType())
                .riskPrediction(riskPrediction)
                .graphAnalysis(graphResult)
                .warnings(warnings)
                .recommendations(recommendations)
                .blockers(blockers)
                .impactSummary(buildImpactSummary(graphResult, riskPrediction, part))
                .analyzedAt(LocalDateTime.now())
                .analyzedBy(request.getUserId())
                .build();

            log.info("Analysis completed: riskScore={}, totalAffected={}",
                riskPrediction.getRiskScore(), graphResult.getTotalAffectedCount());
            return response;

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Impact analysis failed for partId={}", request.getPartId(), e);
            throw new RuntimeException("Impact analysis could not be completed", e);
        }
    }

    private RiskPredictionResponse getRiskPrediction(ImpactAnalysisRequest request, Part part, GraphImpactResult graphResult) {
        try {
            RiskPredictionRequest mlRequest = RiskPredictionRequest.builder()
                .partId(part.getId())
                .changeType(request.getChangeType())
                .bomDepth(graphResult.getBomDepth())
                .whereUsedCount(graphResult.getTotalAffectedCount())
                .releasedAffected(graphResult.getReleasedAffectedCount())
                .conflictingChanges(graphResult.getConflictingChangesCount())
                .lifecycleState(part.getLifecycleState() != null ? part.getLifecycleState().name() : "INWORK")
                .hasComplianceIssues(graphResult.isHasComplianceIssues())
                .build();
            return mlServiceClient.predictRisk(mlRequest);
        } catch (Exception e) {
            log.warn("ML service unavailable, using rule-based fallback: {}", e.getMessage());
            return createFallbackRisk(graphResult, part);
        }
    }

    private RiskPredictionResponse createFallbackRisk(GraphImpactResult graphResult, Part part) {
        double score = 0;
        if (graphResult.getReleasedAffectedCount() > 10)      score += 4;
        else if (graphResult.getReleasedAffectedCount() > 5)  score += 3;
        else if (graphResult.getReleasedAffectedCount() > 2)  score += 2;
        else if (graphResult.getReleasedAffectedCount() > 0)  score += 1;
        if (graphResult.getTotalAffectedCount() > 20)         score += 3;
        else if (graphResult.getTotalAffectedCount() > 10)    score += 2;
        else if (graphResult.getTotalAffectedCount() > 5)     score += 1;
        if (graphResult.getBomDepth() > 5)                    score += 2;
        else if (graphResult.getBomDepth() > 3)               score += 1;
        if (part.getLifecycleState() == LifecycleStateEnum.RELEASED) score += 1;
        String level = score >= 7 ? "HIGH" : score >= 4 ? "MEDIUM" : "LOW";
        return RiskPredictionResponse.builder().riskScore(score).riskLevel(level).confidence(0.75).build();
    }

    private List<String> generateWarnings(GraphImpactResult graphResult, Part part) {
        List<String> warnings = new ArrayList<>();
        if (graphResult.getReleasedAffectedCount() > 0)
            warnings.add(graphResult.getReleasedAffectedCount() + " released part(s) will be affected");
        if (graphResult.getConflictingChangesCount() > 0)
            warnings.add(graphResult.getConflictingChangesCount() + " conflicting change(s) detected");
        if (graphResult.getBomDepth() > 5)
            warnings.add("Deep BOM structure detected (depth > 5)");
        if (graphResult.getTotalAffectedCount() > 20)
            warnings.add("Large impact scope - consider phased implementation");
        if (part.getLifecycleState() == LifecycleStateEnum.RELEASED)
            warnings.add("Changing RELEASED part - ECN required");
        return warnings;
    }

    private List<String> generateRecommendations(GraphImpactResult graphResult, RiskPredictionResponse risk) {
        List<String> recommendations = new ArrayList<>();
        if (risk.getRiskScore() != null && risk.getRiskScore() >= 7) {
            recommendations.add("High risk - senior engineer review required");
            recommendations.add("Schedule impact assessment meeting");
        } else if (risk.getRiskScore() != null && risk.getRiskScore() >= 4) {
            recommendations.add("Medium risk - standard review recommended");
        } else {
            recommendations.add("Low risk - proceed with standard process");
        }
        if (graphResult.getReleasedAffectedCount() > 5)
            recommendations.add("Notify product management - multiple released parts affected");
        if (graphResult.getBomDepth() > 3)
            recommendations.add("Complex BOM - verify all dependencies");
        return recommendations;
    }

    private List<String> generateBlockers(GraphImpactResult graphResult) {
        List<String> blockers = new ArrayList<>();
        if (graphResult.getConflictingChangesCount() > 0
                && graphResult.getConflictingChangeNumbers() != null
                && !graphResult.getConflictingChangeNumbers().isEmpty()) {
            blockers.add("BLOCKER: Active changes exist: "
                + String.join(", ", graphResult.getConflictingChangeNumbers()));
        }
        if (graphResult.isHasComplianceIssues())
            blockers.add("BLOCKER: Compliance issues detected");
        return blockers;
    }

    private String buildImpactSummary(GraphImpactResult graphResult, RiskPredictionResponse risk, Part part) {
        StringBuilder summary = new StringBuilder();
        summary.append(String.format("Changing %s (%s) will affect %d part(s), including %d released. ",
            part.getPartNumber(), part.getName(),
            graphResult.getTotalAffectedCount(), graphResult.getReleasedAffectedCount()));
        if (risk.getRiskScore() != null)
            summary.append(String.format("AI predicts %s risk (%.1f/10). ",
                risk.getRiskLevel(), risk.getRiskScore()));
        if (graphResult.getBomDepth() > 0)
            summary.append(String.format("BOM depth: %d levels.", graphResult.getBomDepth()));
        return summary.toString();
    }
}
