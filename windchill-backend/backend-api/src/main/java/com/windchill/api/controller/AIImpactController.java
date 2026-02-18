package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.service.ai.dto.AIImpactAnalysis;
import com.windchill.service.ai.IAIImpactService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Slf4j
public class AIImpactController {

    private final IAIImpactService aiImpactService;

    /**
     * Analyze the impact of a proposed change to a part.
     * 
     * POST /api/v1/ai/analyze-impact
     * 
     * Request Body:
     * {
     *   "partId": 123,
     *   "changeType": "OBSOLETE"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "AI impact analysis completed successfully",
     *   "data": {
     *     "partId": 123,
     *     "partNumber": "MOTOR-456",
     *     "riskScore": 8.2,
     *     "riskLevel": "HIGH",
     *     "bomDepth": 3,
     *     "whereUsedCount": 12,
     *     "releasedAffected": 3,
     *     "riskFactors": [...],
     *     "recommendation": "...",
     *     "suggestedActions": [...],
     *     "estimatedCycleTimeDays": 13,
     *     "analysisTimeMs": 287
     *   }
     * }
     */
    @PostMapping("/analyze-impact")
    public ResponseEntity<ApiResponse<?>> analyzeImpact(@RequestBody ImpactAnalysisRequest request) {
        log.info("AI Impact analysis request: partId={}, changeType={}", request.getPartId(), request.getChangeType());
        
        try {
            AIImpactAnalysis analysis = aiImpactService.analyzeImpact(request.getPartId(), request.getChangeType());
            
            return ResponseEntity.ok(
                ApiResponse.builder()
                    .success(true)
                    .message("AI impact analysis completed successfully")
                    .data(analysis)
                    .build()
            );
        } catch (Exception e) {
            log.error("AI analysis failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(
                ApiResponse.builder()
                    .success(false)
                    .message("Analysis failed: " + e.getMessage())
                    .data(null)
                    .build()
            );
        }
    }

    /**
     * Check ML service health status.
     * 
     * GET /api/v1/ai/health
     * 
     * Response:
     * {
     *   "success": true,
     *   "message": "AI service is healthy",
     *   "data": null
     * }
     */
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<?>> healthCheck() {
        boolean isHealthy = aiImpactService.isMLServiceHealthy();
        
        return ResponseEntity.ok(
            ApiResponse.builder()
                .success(isHealthy)
                .message(isHealthy ? "AI service is healthy" : "AI service unavailable - using fallback")
                .data(null)
                .build()
        );
    }

    @Data
    public static class ImpactAnalysisRequest {
        private Long partId;
        private String changeType; // OBSOLETE, REVISE, PROMOTE, MODIFY, DELETE, etc.
    }
}
