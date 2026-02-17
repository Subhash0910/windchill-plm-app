package com.windchill.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Risk assessment from ML model.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessment {
    
    private Double score;  // 0-10
    private String level;  // LOW, MEDIUM, HIGH, CRITICAL
    private Double confidence;  // 0-1, model confidence
    private List<String> factors;  // Contributing factors
    private String modelVersion;  // Which model generated this
}
