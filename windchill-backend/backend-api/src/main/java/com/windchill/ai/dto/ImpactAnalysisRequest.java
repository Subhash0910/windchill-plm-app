package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.NotNull;

/**
 * Request DTO for AI impact analysis.
 * 
 * This is sent from frontend/API when user creates/modifies a part or change request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactAnalysisRequest {
    
    @NotNull(message = "Part ID is required")
    private Long partId;
    
    private String partNumber;  // Optional, for display
    
    @NotNull(message = "Change type is required")
    private String changeType;  // REVISE, OBSOLETE, DELETE, MODIFY
    
    private String proposedLifecycleState;  // Optional: NEW, INWORK, RELEASED, etc.
    
    private Long userId;  // Optional: who is making the change
    
    private Long contextId;  // Optional: context/container
}
