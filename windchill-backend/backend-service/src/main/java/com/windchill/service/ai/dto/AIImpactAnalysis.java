package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIImpactAnalysis {
    // Part context
    private Long partId;
    private String partNumber;
    private String partName;
    private String changeType;
    
    // Graph intelligence results
    private Integer bomDepth;
    private Integer whereUsedCount;
    private Integer releasedAffected;
    private Integer conflictingChanges;
    private List<String> affectedPartNumbers;
    
    // ML risk prediction
    private Double riskScore;        // 0-10
    private Double confidence;       // 0-1
    private String riskLevel;        // LOW, MEDIUM, HIGH
    private List<String> riskFactors;
    private String modelType;        // ML or RULE_BASED
    
    // Recommendations
    private String recommendation;
    private List<String> suggestedActions;
    private Integer estimatedCycleTimeDays;
    
    // Metadata
    private LocalDateTime analyzedAt;
    private Long analysisTimeMs;
}
