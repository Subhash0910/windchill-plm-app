package com.windchill.service.ai;

import com.windchill.service.ai.dto.AIImpactAnalysis;

public interface IAIImpactService {
    /**
     * Analyze the impact of a proposed change to a part.
     * Uses graph intelligence + ML risk prediction to assess downstream effects.
     * 
     * @param partId ID of the part being changed
     * @param changeType Type of change (OBSOLETE, REVISE, PROMOTE, etc.)
     * @return Comprehensive impact analysis with risk scoring and recommendations
     */
    AIImpactAnalysis analyzeImpact(Long partId, String changeType);
    
    /**
     * Check if ML service is available and healthy.
     * 
     * @return true if ML service is reachable, false otherwise
     */
    boolean isMLServiceHealthy();
}
