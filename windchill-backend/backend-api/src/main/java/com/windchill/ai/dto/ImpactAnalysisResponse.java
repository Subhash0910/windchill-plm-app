package com.windchill.ai.dto;

import com.windchill.ai.model.AffectedPart;
import com.windchill.ai.model.GraphMetrics;
import com.windchill.ai.model.RiskAssessment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO containing complete AI impact analysis.
 * 
 * Combines graph analysis, ML risk prediction, and recommendations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactAnalysisResponse {
    
    // Basic part info
    private Long partId;
    private String partNumber;
    private String currentLifecycleState;
    
    // Affected items from graph analysis
    private List<AffectedPart> affectedParts;
    
    // Graph metrics
    private GraphMetrics graphMetrics;
    
    // AI risk assessment
    private RiskAssessment riskAssessment;
    
    // Actionable recommendations
    private List<String> recommendations;
    
    // Optional: LLM-generated explanation (Phase 2A)
    private String explanation;
    
    // Metadata
    private Long analysisTimestamp;
    private Integer analysisTimeMs;
}
