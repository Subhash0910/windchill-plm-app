package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO from ML service risk prediction.
 * 
 * Received from Python ML microservice.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionResponse {
    
    private Double riskScore;  // 0-10
    private String riskLevel;  // LOW, MEDIUM, HIGH, CRITICAL
    private Double confidence;  // 0-1
    private List<String> factors;  // Risk factors identified
    private List<String> recommendations;  // Suggested actions
    private String modelVersion;  // ML_V1 or RULE_BASED_V1
    private Double predictionTimeMs;  // Latency tracking
}
