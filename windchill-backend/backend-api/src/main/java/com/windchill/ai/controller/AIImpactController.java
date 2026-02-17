package com.windchill.ai.controller;

import com.windchill.ai.dto.ImpactAnalysisRequest;
import com.windchill.ai.dto.ImpactAnalysisResponse;
import com.windchill.ai.service.ImpactAnalyzerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST API for AI-powered impact analysis.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ai/impact")
@CrossOrigin(origins = "*")
public class AIImpactController {

    @Autowired
    private ImpactAnalyzerService impactAnalyzerService;

    /**
     * Analyze the impact of a proposed change to a part.
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeImpact(@RequestBody ImpactAnalysisRequest request) {
        
        log.info("Received impact analysis request: partId={}, changeType={}", 
                request.getPartId(), request.getChangeType());

        try {
            // Validate request
            if (request.getPartId() == null) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Part ID is required"));
            }
            
            if (request.getChangeType() == null || request.getChangeType().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse("Change type is required"));
            }

            // Perform analysis
            ImpactAnalysisResponse response = impactAnalyzerService.analyzeChange(request);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(createErrorResponse(e.getMessage()));
            
        } catch (Exception e) {
            log.error("Impact analysis failed for partId={}", request.getPartId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Impact analysis failed: " + e.getMessage()));
        }
    }

    private Map<String, String> createErrorResponse(String message) {
        Map<String, String> error = new HashMap<>();
        error.put("error", message);
        error.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return error;
    }
}