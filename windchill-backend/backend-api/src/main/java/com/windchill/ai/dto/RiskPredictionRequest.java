package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for ML service risk prediction.
 * 
 * This is sent to Python ML microservice.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionRequest {
    
    private Long partId;
    private String partNumber;
    private String changeType;
    
    // Graph metrics from Java backend
    private Integer bomDepth;
    private Integer whereUsedCount;
    private Integer releasedAffected;
    private Integer conflictingChanges;
    
    // Part metadata
    private String lifecycleState;
    private String classification;
    
    // Context
    private Long userId;
    private Long contextId;
}
