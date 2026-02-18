package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.service.ai.AIImpactAnalysis;
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

    @PostMapping("/analyze-impact")
    public ResponseEntity<ApiResponse<?>> analyzeImpact(@RequestBody ImpactAnalysisRequest request) {
        log.info("AI Impact analysis request: partId={}, changeType={}", request.getPartId(), request.getChangeType());
        
        AIImpactAnalysis analysis = aiImpactService.analyzeImpact(request.getPartId(), request.getChangeType());
        
        return ResponseEntity.ok(
            ApiResponse.builder()
                .success(true)
                .message("AI impact analysis completed successfully")
                .data(analysis)
                .build()
        );
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<?>> healthCheck() {
        boolean isHealthy = aiImpactService.isMLServiceAvailable();
        
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
        private String changeType; // OBSOLETE, REVISE, PROMOTE, etc.
    }
}
