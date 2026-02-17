package com.windchill.ai.controller;

import com.windchill.ai.dto.ImpactAnalysisRequest;
import com.windchill.ai.dto.ImpactAnalysisResponse;
import com.windchill.ai.service.ImpactAnalyzerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for AI-powered impact analysis.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai/impact")
public class AIImpactController {

    @Autowired
    private ImpactAnalyzerService impactAnalyzerService;

    /**
     * Analyze the impact of a proposed change to a part.
     * 
     * @param request Contains partId, changeType, and userId
     * @return Complete impact analysis with risk score, warnings, recommendations
     */
    @PostMapping("/analyze")
    public ResponseEntity<ImpactAnalysisResponse> analyzeImpact(
            @RequestBody ImpactAnalysisRequest request) {
        
        log.info("Received impact analysis request: partId={}, changeType={}", 
                request.getPartId(), request.getChangeType());

        try {
            ImpactAnalysisResponse response = impactAnalyzerService.analyzeChange(request);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
            
        } catch (Exception e) {
            log.error("Impact analysis failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Health check for AI service.
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Impact Analysis service is running");
    }
}