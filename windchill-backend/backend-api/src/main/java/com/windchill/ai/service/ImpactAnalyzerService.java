package com.windchill.ai.service;

import com.windchill.ai.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Main service orchestrating impact analysis.
 * Combines graph analysis with ML risk prediction.
 */
@Slf4j
@Service
public class ImpactAnalyzerService {

    @Autowired
    private GraphAnalysisService graphAnalysisService;

    @Autowired
    @Qualifier("mlServiceRestTemplate")
    private RestTemplate mlServiceRestTemplate;

    /**
     * Perform complete impact analysis for a proposed change.
     * 
     * @param request Impact analysis request
     * @return Comprehensive analysis with risk score and recommendations
     */
    public ImpactAnalysisResponse analyzeChange(ImpactAnalysisRequest request) {
        log.info("Starting impact analysis for partId={}, changeType={}", 
                request.getPartId(), request.getChangeType());

        try {
            // Step 1: Graph-based structural analysis
            GraphImpactResult graphResult = graphAnalysisService.analyzePartChange(
                    request.getPartId(), 
                    request.getChangeType()
            );

            // Step 2: Call ML service for risk prediction
            RiskPredictionResponse riskPrediction = predictRisk(graphResult, request);

            // Step 3: Generate recommendations
            List<String> recommendations = generateRecommendations(graphResult, riskPrediction);

            // Step 4: Generate warnings
            List<String> warnings = generateWarnings(graphResult, riskPrediction);

            // Step 5: Identify blockers
            List<String> blockers = identifyBlockers(graphResult, riskPrediction);

            // Step 6: Create summary
            String summary = generateSummary(graphResult, riskPrediction);

            return ImpactAnalysisResponse.builder()
                    .partId(request.getPartId())
                    .partNumber("PART-" + request.getPartId()) // TODO: Get from part service
                    .changeType(request.getChangeType())
                    .graphAnalysis(graphResult)
                    .riskPrediction(riskPrediction)
                    .impactSummary(summary)
                    .recommendations(recommendations)
                    .warnings(warnings)
                    .blockers(blockers)
                    .analyzedAt(LocalDateTime.now())
                    .analyzedBy(request.getUserId())
                    .build();

        } catch (Exception e) {
            log.error("Impact analysis failed for partId={}", request.getPartId(), e);
            throw new RuntimeException("Impact analysis failed: " + e.getMessage(), e);
        }
    }

    /**
     * Call ML service for risk prediction.
     */
    private RiskPredictionResponse predictRisk(GraphImpactResult graphResult, ImpactAnalysisRequest request) {
        try {
            RiskPredictionRequest mlRequest = RiskPredictionRequest.builder()
                    .partId(request.getPartId())
                    .changeType(request.getChangeType())
                    .bomDepth(graphResult.getBomDepth())
                    .whereUsedCount(graphResult.getTotalAffectedCount())
                    .releasedAffected(graphResult.getReleasedAffectedCount())
                    .conflictingChanges(graphResult.getConflictingChangesCount())
                    .lifecycleState(graphResult.getCurrentLifecycleState())
                    .hasComplianceIssues(graphResult.isHasComplianceIssues())
                    .build();

            log.debug("Calling ML service with request: {}", mlRequest);

            RiskPredictionResponse response = mlServiceRestTemplate.postForObject(
                    "/predict-risk",
                    mlRequest,
                    RiskPredictionResponse.class
            );

            log.info("ML service prediction: riskScore={}, riskLevel={}, modelType={}",
                    response.getRiskScore(), response.getRiskLevel(), response.getModelType());

            return response;

        } catch (RestClientException e) {
            log.error("ML service call failed, using fallback", e);
            // Fallback to simple rule-based scoring if ML service unavailable
            return createFallbackRiskPrediction(graphResult);
        }
    }

    /**
     * Fallback risk prediction if ML service is unavailable.
     */
    private RiskPredictionResponse createFallbackRiskPrediction(GraphImpactResult graphResult) {
        double riskScore = Math.min(graphResult.getStructuralComplexity(), 10.0);
        String riskLevel = riskScore < 4 ? "LOW" : riskScore < 7 ? "MEDIUM" : "HIGH";

        return RiskPredictionResponse.builder()
                .riskScore(riskScore)
                .confidence(0.6) // Lower confidence for fallback
                .riskLevel(riskLevel)
                .factors(List.of("ML service unavailable - using structural complexity score"))
                .modelType("FALLBACK")
                .timestamp(LocalDateTime.now().toString())
                .build();
    }

    /**
     * Generate actionable recommendations based on analysis.
     */
    private List<String> generateRecommendations(GraphImpactResult graphResult, RiskPredictionResponse risk) {
        List<String> recommendations = new ArrayList<>();

        if ("HIGH".equals(risk.getRiskLevel())) {
            recommendations.add("Create formal ECN with detailed change tasks");
            recommendations.add("Assign senior engineer or domain expert for review");
            recommendations.add("Schedule impact review meeting with stakeholders");
            
            if (graphResult.getReleasedAffectedCount() > 0) {
                recommendations.add("Notify all teams owning affected released parts");
            }
        } else if ("MEDIUM".equals(risk.getRiskLevel())) {
            recommendations.add("Document all affected assemblies in change description");
            recommendations.add("Request peer review before submission");
            recommendations.add("Verify BOM references are up to date");
        } else {
            recommendations.add("Proceed with standard review process");
        }

        if (graphResult.getConflictingChangesCount() > 0) {
            recommendations.add("Coordinate with owners of conflicting changes: " + 
                    String.join(", ", graphResult.getConflictingChangeNumbers()));
        }

        return recommendations;
    }

    /**
     * Generate warnings for potential issues.
     */
    private List<String> generateWarnings(GraphImpactResult graphResult, RiskPredictionResponse risk) {
        List<String> warnings = new ArrayList<>();

        if (graphResult.getReleasedAffectedCount() > 0) {
            warnings.add(String.format("%d released part(s) will be affected - requires formal change process",
                    graphResult.getReleasedAffectedCount()));
        }

        if (graphResult.isHasComplexStructure()) {
            warnings.add("Complex BOM structure detected - review all dependencies carefully");
        }

        warnings.addAll(graphResult.getComplianceWarnings());

        return warnings;
    }

    /**
     * Identify blocking issues that must be resolved.
     */
    private List<String> identifyBlockers(GraphImpactResult graphResult, RiskPredictionResponse risk) {
        List<String> blockers = new ArrayList<>();

        if (graphResult.isHasComplianceIssues()) {
            blockers.add("Compliance violations detected - resolve before proceeding");
        }

        // Add more business rule checks here

        return blockers;
    }

    /**
     * Generate human-readable summary.
     */
    private String generateSummary(GraphImpactResult graphResult, RiskPredictionResponse risk) {
        return String.format(
                "Risk Level: %s (%.1f/10). Affects %d part(s), including %d released. " +
                "BOM complexity: %d levels deep. %s",
                risk.getRiskLevel(),
                risk.getRiskScore(),
                graphResult.getTotalAffectedCount(),
                graphResult.getReleasedAffectedCount(),
                graphResult.getBomDepth(),
                graphResult.getConflictingChangesCount() > 0 
                    ? "Conflicts with " + graphResult.getConflictingChangesCount() + " active change(s)." 
                    : "No conflicts detected."
        );
    }
}