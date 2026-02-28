package com.windchill.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Response DTO from ML service risk prediction.
 * Maps to Python FastAPI RiskPredictionResponse.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionResponse {

    @JsonProperty("risk_score")
    private Double riskScore; // 0-10

    @JsonProperty("confidence")
    private Double confidence; // 0-1

    @JsonProperty("risk_level")
    private String riskLevel; // LOW, MEDIUM, HIGH

    @JsonProperty("factors")
    private List<String> factors;

    @JsonProperty("model_type")
    private String modelType; // ML or RULE_BASED

    @JsonProperty("timestamp")
    private String timestamp;
}