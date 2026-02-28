package com.windchill.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ML Risk Response DTO
 * 
 * FIXED: Added @JsonProperty to handle Python's snake_case response format
 * Python ML service returns: risk_score, risk_level, model_type
 * Java expects: riskScore, riskLevel, modelType
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLRiskResponse {
    @JsonProperty("risk_score")
    private Double riskScore;      // 0-10
    
    @JsonProperty("confidence")
    private Double confidence;     // 0-1
    
    @JsonProperty("risk_level")
    private String riskLevel;      // LOW, MEDIUM, HIGH
    
    @JsonProperty("factors")
    private List<String> factors;  // Risk contributing factors
    
    @JsonProperty("model_type")
    private String modelType;      // ML or RULE_BASED
    
    @JsonProperty("timestamp")
    private String timestamp;
}
