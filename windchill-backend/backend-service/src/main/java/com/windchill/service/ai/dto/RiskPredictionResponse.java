package com.windchill.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RiskPredictionResponse {

    @JsonProperty("risk_score")  private Double riskScore;
    @JsonProperty("confidence")  private Double confidence;
    @JsonProperty("risk_level")  private String riskLevel;
    @JsonProperty("factors")     private List<String> factors;
    @JsonProperty("model_type")  private String modelType;
    @JsonProperty("timestamp")   private String timestamp;
}
