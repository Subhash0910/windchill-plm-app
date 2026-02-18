package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLRiskResponse {
    private Double riskScore;      // 0-10
    private Double confidence;     // 0-1
    private String riskLevel;      // LOW, MEDIUM, HIGH
    private List<String> factors;  // Risk contributing factors
    private String modelType;      // ML or RULE_BASED
    private String timestamp;
}
