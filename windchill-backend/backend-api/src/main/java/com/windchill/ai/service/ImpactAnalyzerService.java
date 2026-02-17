package com.windchill.ai.service;

import com.windchill.ai.dto.*;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import com.windchill.repository.PartRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Core service orchestrating AI-powered impact analysis.
 */
@Slf4j
@Service
public class ImpactAnalyzerService {

    @Autowired
    private GraphAnalysisService graphAnalysisService;

    @Autowired
    private MLServiceClient mlServiceClient;

    @Autowired
    private PartRepository partRepository;

    public ImpactAnalysisResponse analyzeChange(ImpactAnalysisRequest request) {
        log.info("Starting impact analysis: partId={}, changeType={}", 
                request.getPartId(), request.getChangeType());

        try {
            // Step 1: Validate part exists
            Part part = partRepository.findById(request.getPartId())
                    .orElseThrow(() -> new RuntimeException("Part not found: " + request.getPartId()));

            log.info("Analyzing part: {} ({}), state={}",
                    part.getPartNumber(), part.getName(), part.getLifecycleState());

            // Step 2: Graph analysis
            GraphImpactResult graphResult = graphAnalysisService.analyzePartChange(
                    request.getPartId(), request.getChangeType()
            );

            // Step 3: ML prediction
            RiskPredictionRequest mlRequest = buildMLRequest(request, part, graphResult);
            RiskPredictionResponse riskPrediction = mlServiceClient.predictRisk(mlRequest);

            // Step 4: Business rules
            List<String> warnings = generateWarnings(graphResult, part);
            List<String> recommendations = generateRecommendations(graphResult, riskPrediction, part);
            List<String> blockers = generateBlockers(graphResult, part);

            // Step 5: Build response
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

        } catch (Exception e) {
            log.error("Impact analysis failed", e);
            throw new RuntimeException("Impact analysis failed: " + e.getMessage(), e);
        }
    }

    private RiskPredictionRequest buildMLRequest(ImpactAnalysisRequest request, 
                                                   Part part, 
                                                   GraphImpactResult graphResult) {
        return RiskPredictionRequest.builder()
                .partId(part.getId())
                .changeType(request.getChangeType())
                .bomDepth(graphResult.getBomDepth())
                .whereUsedCount(graphResult.getTotalAffectedCount())
                .releasedAffected(graphResult.getReleasedAffectedCount())
                .conflictingChanges(graphResult.getConflictingChangesCount())
                .lifecycleState(part.getLifecycleState() != null ? 
                        part.getLifecycleState().name() : "INWORK")
                .hasComplianceIssues(graphResult.isHasComplianceIssues())
                .build();
    }

    private List<String> generateWarnings(GraphImpactResult graphResult, Part part) {
        List<String> warnings = new ArrayList<>();

        if (graphResult.getReleasedAffectedCount() > 0) {
            warnings.add(String.format("%d released part(s) will be affected", 
                    graphResult.getReleasedAffectedCount()));
        }

        if (graphResult.getConflictingChangesCount() > 0) {
            warnings.add(String.format("%d conflicting change(s) detected", 
                    graphResult.getConflictingChangesCount()));
        }

        if (graphResult.getBomDepth() > 5) {
            warnings.add("Deep BOM structure detected (depth > 5)");
        }

        if (graphResult.getTotalAffectedCount() > 20) {
            warnings.add("Large impact scope - consider phased implementation");
        }

        if (part.getLifecycleState() == LifecycleStateEnum.RELEASED) {
            warnings.add("Changing RELEASED part - ECN required");
        }

        return warnings;
    }

    private List<String> generateRecommendations(GraphImpactResult graphResult, 
                                                   RiskPredictionResponse risk, 
                                                   Part part) {
        List<String> recommendations = new ArrayList<>();

        if (risk.getRiskScore() != null && risk.getRiskScore() > 7.0) {
            recommendations.add("High risk - senior engineer review required");
            recommendations.add("Schedule impact assessment meeting");
        } else if (risk.getRiskScore() != null && risk.getRiskScore() > 4.0) {
            recommendations.add("Medium risk - standard review recommended");
        } else {
            recommendations.add("Low risk - proceed with standard process");
        }

        if (graphResult.getReleasedAffectedCount() > 5) {
            recommendations.add("Notify product management - multiple released parts affected");
        }

        if (graphResult.getBomDepth() > 3) {
            recommendations.add("Complex BOM - verify all dependencies");
        }

        return recommendations;
    }

    private List<String> generateBlockers(GraphImpactResult graphResult, Part part) {
        List<String> blockers = new ArrayList<>();

        if (graphResult.getConflictingChangesCount() > 0 && 
            graphResult.getConflictingChangeNumbers() != null &&
            !graphResult.getConflictingChangeNumbers().isEmpty()) {
            blockers.add("BLOCKER: Active changes exist: " + 
                    String.join(", ", graphResult.getConflictingChangeNumbers()));
        }

        if (graphResult.isHasComplianceIssues()) {
            blockers.add("BLOCKER: Compliance issues detected");
        }

        return blockers;
    }

    private String buildImpactSummary(GraphImpactResult graphResult, 
                                       RiskPredictionResponse risk, 
                                       Part part) {
        StringBuilder summary = new StringBuilder();
        
        summary.append(String.format("Changing %s (%s) will affect ", 
                part.getPartNumber(), part.getName()));
        summary.append(String.format("%d part(s), including %d released. ",
                graphResult.getTotalAffectedCount(),
                graphResult.getReleasedAffectedCount()));
        
        if (risk.getRiskScore() != null) {
            summary.append(String.format("AI predicts %s risk (%.1f/10). ",
                    risk.getRiskLevel(), risk.getRiskScore()));
        }

        if (graphResult.getBomDepth() > 0) {
            summary.append(String.format("BOM depth: %d levels.", graphResult.getBomDepth()));
        }

        return summary.toString();
    }
}