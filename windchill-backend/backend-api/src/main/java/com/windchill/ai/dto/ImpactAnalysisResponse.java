package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.time.LocalDateTime;

/**
 * Response DTO containing complete impact analysis results.
 * Combines graph analysis and ML risk prediction.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactAnalysisResponse {

    // Identification
    private Long partId;
    private String partNumber;
    private String changeType;

    // Graph Analysis Results
    private GraphImpactResult graphAnalysis;

    // ML Risk Prediction
    private RiskPredictionResponse riskPrediction;

    // High-level summary
    private String impactSummary;
    private List<String> recommendations;
    private List<String> warnings;
    private List<String> blockers; // Issues that must be resolved before proceeding

    // Metadata
    private LocalDateTime analyzedAt;
    private Long analyzedBy;
}