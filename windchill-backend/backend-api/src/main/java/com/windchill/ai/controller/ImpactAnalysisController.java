package com.windchill.ai.controller;

import com.windchill.ai.dto.ImpactAnalysisRequest;
import com.windchill.ai.dto.ImpactAnalysisResponse;
import com.windchill.ai.service.ImpactAnalyzerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST API for AI-powered engineering impact analysis.
 * Provides endpoints for analyzing change impact and risk prediction.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai/impact")
@Tag(name = "AI Impact Analysis", description = "AI-powered engineering change impact analysis and risk prediction")
public class ImpactAnalysisController {

    @Autowired
    private ImpactAnalyzerService impactAnalyzerService;

    /**
     * Analyze the impact of a proposed engineering change.
     * 
     * @param request Impact analysis request with part ID and change type
     * @return Comprehensive impact analysis with risk score and recommendations
     */
    @PostMapping("/analyze")
    @Operation(
        summary = "Analyze engineering change impact",
        description = "Performs comprehensive impact analysis using graph algorithms and ML risk prediction. " +
                     "Returns affected parts, risk score, recommendations, and warnings."
    )
    public ResponseEntity<ImpactAnalysisResponse> analyzeChange(
            @RequestBody ImpactAnalysisRequest request) {
        
        log.info("Received impact analysis request: partId={}, changeType={}", 
                request.getPartId(), request.getChangeType());

        try {
            ImpactAnalysisResponse response = impactAnalyzerService.analyzeChange(request);
            
            log.info("Impact analysis completed: partId={}, riskLevel={}, riskScore={}",
                    request.getPartId(), 
                    response.getRiskPrediction().getRiskLevel(),
                    response.getRiskPrediction().getRiskScore());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Impact analysis failed for partId={}", request.getPartId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Health check endpoint for AI services.
     */
    @GetMapping("/health")
    @Operation(
        summary = "AI service health check",
        description = "Check if AI impact analysis services are operational"
    )
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Impact Analysis Service is running");
    }
}