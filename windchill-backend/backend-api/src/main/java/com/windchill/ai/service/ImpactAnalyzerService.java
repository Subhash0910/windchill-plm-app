package com.windchill.ai.service;

import com.windchill.ai.dto.ImpactAnalysisRequest;
import com.windchill.ai.dto.ImpactAnalysisResponse;
import com.windchill.ai.dto.RiskPredictionRequest;
import com.windchill.ai.dto.RiskPredictionResponse;
import com.windchill.ai.model.RiskAssessment;
import com.windchill.ai.service.GraphAnalysisService.GraphAnalysisResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Main orchestrator service for AI Impact Analysis.
 * 
 * Coordinates all 3 layers:
 * - Layer 1: Graph Intelligence (GraphAnalysisService)
 * - Layer 2: ML Risk Prediction (MLServiceClient)
 * - Layer 3: LLM Reasoning (TODO: Phase 2A)
 * 
 * This is the service that controllers call.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ImpactAnalyzerService {
    
    private final GraphAnalysisService graphService;
    private final MLServiceClient mlClient;
    
    /**
     * Perform comprehensive AI impact analysis.
     * 
     * @param request Impact analysis request
     * @return Complete analysis with graph metrics, risk score, and recommendations
     */
    public ImpactAnalysisResponse analyze(ImpactAnalysisRequest request) {
        log.info("Starting AI impact analysis: part_id={}, change_type={}",
                request.getPartId(), request.getChangeType());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // ==================== Layer 1: Graph Analysis ====================
            GraphAnalysisResult graphResult = graphService.analyzePartChange(
                    request.getPartId(),
                    request.getChangeType()
            );
            
            // ==================== Layer 2: ML Risk Prediction ====================
            RiskPredictionRequest mlRequest = buildMLRequest(request, graphResult);
            RiskPredictionResponse mlResponse = mlClient.predictRisk(mlRequest);
            
            // Convert ML response to RiskAssessment model
            RiskAssessment riskAssessment = RiskAssessment.builder()
                    .score(mlResponse.getRiskScore())
                    .level(mlResponse.getRiskLevel())
                    .confidence(mlResponse.getConfidence())
                    .factors(mlResponse.getFactors())
                    .modelVersion(mlResponse.getModelVersion())
                    .build();
            
            // ==================== Generate Recommendations ====================
            List<String> recommendations = generateRecommendations(
                    mlResponse.getRiskLevel(),
                    graphResult,
                    request.getChangeType()
            );
            
            // Merge ML recommendations
            if (mlResponse.getRecommendations() != null) {
                recommendations.addAll(mlResponse.getRecommendations());
            }
            
            // ==================== Layer 3: LLM Explanation (TODO: Phase 2A) ====================
            String explanation = null;  // TODO: Call LLM service for natural language explanation
            
            // ==================== Build Response ====================
            long totalTime = System.currentTimeMillis() - startTime;
            
            ImpactAnalysisResponse response = ImpactAnalysisResponse.builder()
                    .partId(request.getPartId())
                    .partNumber(request.getPartNumber())
                    .currentLifecycleState(graphResult.getMetrics() != null ? "UNKNOWN" : "UNKNOWN")  // TODO: Get from Part entity
                    .affectedParts(graphResult.getAffectedParts())
                    .graphMetrics(graphResult.getMetrics())
                    .riskAssessment(riskAssessment)
                    .recommendations(recommendations)
                    .explanation(explanation)
                    .analysisTimestamp(System.currentTimeMillis())
                    .analysisTimeMs((int) totalTime)
                    .build();
            
            log.info("AI analysis complete in {}ms: risk={}, affected_parts={}",
                    totalTime,
                    mlResponse.getRiskLevel(),
                    graphResult.getAffectedParts().size());
            
            return response;
            
        } catch (Exception e) {
            log.error("AI impact analysis failed for part_id={}", request.getPartId(), e);
            throw new RuntimeException("Impact analysis failed", e);
        }
    }
    
    /**
     * Build ML service request from graph analysis results.
     */
    private RiskPredictionRequest buildMLRequest(
            ImpactAnalysisRequest request,
            GraphAnalysisResult graphResult) {
        
        return RiskPredictionRequest.builder()
                .partId(request.getPartId())
                .partNumber(request.getPartNumber())
                .changeType(request.getChangeType())
                .bomDepth(graphResult.getMetrics().getBomDepth())
                .whereUsedCount(graphResult.getMetrics().getWhereUsedCount())
                .releasedAffected(graphResult.getMetrics().getReleasedAffected())
                .conflictingChanges(graphResult.getMetrics().getConflictingChanges())
                .lifecycleState(request.getProposedLifecycleState() != null ? 
                        request.getProposedLifecycleState() : "UNKNOWN")
                .classification(null)  // TODO: Get from Part entity
                .userId(request.getUserId())
                .contextId(request.getContextId())
                .build();
    }
    
    /**
     * Generate actionable recommendations based on analysis.
     */
    private List<String> generateRecommendations(
            String riskLevel,
            GraphAnalysisResult graphResult,
            String changeType) {
        
        List<String> recommendations = new ArrayList<>();
        
        // High-level recommendations based on risk
        switch (riskLevel) {
            case "CRITICAL":
            case "HIGH":
                recommendations.add("⚠️ Create formal ECN with detailed change tasks for all affected assemblies");
                recommendations.add("👥 Assign senior engineer or domain expert for review");
                recommendations.add("📅 Schedule impact assessment meeting with stakeholders");
                break;
                
            case "MEDIUM":
                recommendations.add("📝 Document affected assemblies in ECR description");
                recommendations.add("👀 Request peer review from team member");
                recommendations.add("✅ Verify no active production orders use affected parts");
                break;
                
            case "LOW":
                recommendations.add("✅ Standard review process is sufficient");
                recommendations.add("🚀 Proceed with confidence");
                break;
        }
        
        // Specific recommendations based on graph analysis
        if (graphResult.getMetrics().getConflictingChanges() > 0) {
            recommendations.add(
                    String.format("🔄 Coordinate with owners of %d conflicting change(s) before proceeding",
                            graphResult.getMetrics().getConflictingChanges())
            );
        }
        
        if (graphResult.getMetrics().getReleasedAffected() > 0) {
            recommendations.add(
                    String.format("📦 Plan cascading ECN for %d released assembl%s",
                            graphResult.getMetrics().getReleasedAffected(),
                            graphResult.getMetrics().getReleasedAffected() == 1 ? "y" : "ies")
            );
        }
        
        if ("OBSOLETE".equals(changeType) && graphResult.getMetrics().getWhereUsedCount() > 5) {
            recommendations.add("🔍 Consider suggesting replacement part to minimize downstream impact");
        }
        
        return recommendations;
    }
}
