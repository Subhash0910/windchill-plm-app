package com.windchill.ai.service;

import com.windchill.ai.dto.*;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Core service orchestrating AI-powered impact analysis.
 * Combines graph analysis, ML risk prediction, and business rules.
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

    @Autowired
    private BomLineRepository bomLineRepository;

    /**
     * Main entry point for impact analysis.
     * Orchestrates graph analysis, ML prediction, and business rule evaluation.
     */
    public ImpactAnalysisResponse analyzeChange(ImpactAnalysisRequest request) {
        log.info("Starting impact analysis: partId={}, changeType={}", 
                request.getPartId(), request.getChangeType());

        try {
            // Step 1: Validate part exists
            Part part = partRepository.findById(request.getPartId())
                    .orElseThrow(() -> new RuntimeException("Part not found: " + request.getPartId()));

            log.info("Analyzing part: {} ({}), state={}, version={}",
                    part.getNumber(), part.getName(), part.getLifecycleState(), part.getVersionId());

            // Step 2: Perform graph-based structural analysis
            GraphImpactResult graphResult = graphAnalysisService.analyzePartChange(
                    request.getPartId(), 
                    request.getChangeType()
            );

            // Step 3: Prepare ML prediction request
            RiskPredictionRequest mlRequest = buildMLRequest(request, part, graphResult);

            // Step 4: Get ML risk prediction
            RiskPredictionResponse riskPrediction = mlServiceClient.predictRisk(mlRequest);

            // Step 5: Apply business rules and generate warnings/recommendations
            List<String> warnings = generateWarnings(graphResult, part);
            List<String> recommendations = generateRecommendations(graphResult, riskPrediction, part);
            List<String> blockers = generateBlockers(graphResult, part);

            // Step 6: Get affected parts details
            List<AffectedPartInfo> affectedParts = getAffectedPartsDetails(graphResult.getAffectedPartIds());

            // Step 7: Build response
            ImpactAnalysisResponse response = ImpactAnalysisResponse.builder()
                    .riskPrediction(riskPrediction)
                    .graphAnalysis(graphResult)
                    .warnings(warnings)
                    .recommendations(recommendations)
                    .blockers(blockers)
                    .affectedParts(affectedParts)
                    .impactSummary(buildImpactSummary(graphResult, riskPrediction, part))
                    .analysisTimestamp(Instant.now().toString())
                    .build();

            log.info("Impact analysis completed: partId={}, riskScore={}, totalAffected={}",
                    request.getPartId(), 
                    riskPrediction.getRiskScore(),
                    graphResult.getTotalAffectedCount());

            return response;

        } catch (Exception e) {
            log.error("Impact analysis failed for partId={}", request.getPartId(), e);
            throw new RuntimeException("Impact analysis failed: " + e.getMessage(), e);
        }
    }

    /**
     * Build ML prediction request from graph analysis results
     */
    private RiskPredictionRequest buildMLRequest(ImpactAnalysisRequest request, 
                                                   Part part, 
                                                   GraphImpactResult graphResult) {
        return RiskPredictionRequest.builder()
                .partNumber(part.getNumber())
                .changeType(request.getChangeType())
                .lifecycleState(part.getLifecycleState() != null ? part.getLifecycleState().name() : "INWORK")
                .bomDepth(graphResult.getBomDepth())
                .totalAffectedParts(graphResult.getTotalAffectedCount())
                .releasedAffectedCount(graphResult.getReleasedAffectedCount())
                .hasActiveChanges(graphResult.getConflictingChangesCount() > 0)
                .complexStructure(graphResult.isHasComplexStructure())
                .build();
    }

    /**
     * Generate business rule warnings based on graph analysis
     */
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
            warnings.add("Deep BOM structure detected (depth > 5) - review may take longer");
        }

        if (graphResult.getTotalAffectedCount() > 20) {
            warnings.add("Large impact scope - consider phased implementation");
        }

        if ("RELEASED".equals(part.getLifecycleState() != null ? part.getLifecycleState().name() : "")) {
            warnings.add("Changing a RELEASED part - ECN required");
        }

        return warnings;
    }

    /**
     * Generate AI recommendations
     */
    private List<String> generateRecommendations(GraphImpactResult graphResult, 
                                                   RiskPredictionResponse risk, 
                                                   Part part) {
        List<String> recommendations = new ArrayList<>();

        if (risk.getRiskScore() != null && risk.getRiskScore() > 7.0) {
            recommendations.add("High risk detected - consider senior engineer review");
            recommendations.add("Schedule impact assessment meeting with affected teams");
        } else if (risk.getRiskScore() != null && risk.getRiskScore() > 4.0) {
            recommendations.add("Medium risk - standard review process recommended");
        } else {
            recommendations.add("Low risk - proceed with standard change process");
        }

        if (graphResult.getReleasedAffectedCount() > 5) {
            recommendations.add("Multiple released parts affected - notify product management");
        }

        if (graphResult.getBomDepth() > 3) {
            recommendations.add("Complex BOM structure - verify all dependencies");
        }

        return recommendations;
    }

    /**
     * Generate blocking conditions
     */
    private List<String> generateBlockers(GraphImpactResult graphResult, Part part) {
        List<String> blockers = new ArrayList<>();

        if (graphResult.getConflictingChangesCount() > 0 && 
            graphResult.getConflictingChangeNumbers() != null &&
            !graphResult.getConflictingChangeNumbers().isEmpty()) {
            blockers.add("BLOCKER: Active changes exist: " + 
                    String.join(", ", graphResult.getConflictingChangeNumbers()));
        }

        if (graphResult.isHasComplianceIssues()) {
            blockers.add("BLOCKER: Compliance issues detected - resolution required");
        }

        return blockers;
    }

    /**
     * Get detailed info about affected parts
     */
    private List<AffectedPartInfo> getAffectedPartsDetails(List<Long> affectedPartIds) {
        List<AffectedPartInfo> affectedParts = new ArrayList<>();

        if (affectedPartIds != null && !affectedPartIds.isEmpty()) {
            List<Part> parts = partRepository.findAllById(affectedPartIds);
            for (Part part : parts) {
                AffectedPartInfo info = new AffectedPartInfo();
                info.setPartId(part.getId());
                info.setPartNumber(part.getNumber());
                info.setName(part.getName());
                info.setLifecycleState(part.getLifecycleState() != null ? 
                        part.getLifecycleState().name() : "UNKNOWN");
                info.setVersion(part.getVersionId());
                affectedParts.add(info);
            }
        }

        return affectedParts;
    }

    /**
     * Build human-readable impact summary
     */
    private String buildImpactSummary(GraphImpactResult graphResult, 
                                       RiskPredictionResponse risk, 
                                       Part part) {
        StringBuilder summary = new StringBuilder();
        
        summary.append(String.format("Changing part %s (%s) will affect ", 
                part.getNumber(), part.getName()));
        summary.append(String.format("%d total part(s), including %d released part(s). ",
                graphResult.getTotalAffectedCount(),
                graphResult.getReleasedAffectedCount()));
        
        if (risk.getRiskScore() != null) {
            summary.append(String.format("AI predicts %s risk (score: %.1f/10). ",
                    risk.getRiskLevel(), risk.getRiskScore()));
        }

        if (graphResult.getBomDepth() > 0) {
            summary.append(String.format("BOM depth: %d levels. ", graphResult.getBomDepth()));
        }

        return summary.toString();
    }
}