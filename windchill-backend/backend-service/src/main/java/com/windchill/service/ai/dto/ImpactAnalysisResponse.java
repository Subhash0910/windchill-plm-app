package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImpactAnalysisResponse {

    private Long partId;
    private String partNumber;
    private String changeType;

    private GraphImpactResult graphAnalysis;
    private RiskPredictionResponse riskPrediction;

    private String impactSummary;
    private List<String> recommendations;
    private List<String> warnings;
    private List<String> blockers;

    private LocalDateTime analyzedAt;
    private Long analyzedBy;
}
