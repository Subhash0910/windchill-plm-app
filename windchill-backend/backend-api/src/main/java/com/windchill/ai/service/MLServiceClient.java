package com.windchill.ai.service;

import com.windchill.ai.dto.RiskPredictionRequest;
import com.windchill.ai.dto.RiskPredictionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;

/**
 * Client for communicating with Python ML microservice.
 * 
 * Handles HTTP calls, error handling, and fallback logic.
 */
@Slf4j
@Service
public class MLServiceClient {
    
    private final RestTemplate restTemplate;
    private final String mlServiceUrl;
    private final boolean mlServiceEnabled;
    
    public MLServiceClient(
            RestTemplate restTemplate,
            @Value("${ml.service.url:http://ml-service:5000}") String mlServiceUrl,
            @Value("${ml.service.enabled:true}") boolean mlServiceEnabled) {
        this.restTemplate = restTemplate;
        this.mlServiceUrl = mlServiceUrl;
        this.mlServiceEnabled = mlServiceEnabled;
        log.info("ML Service Client initialized: url={}, enabled={}", mlServiceUrl, mlServiceEnabled);
    }
    
    /**
     * Predict risk score for a change request.
     * 
     * @param request Risk prediction request
     * @return Risk prediction response
     */
    public RiskPredictionResponse predictRisk(RiskPredictionRequest request) {
        if (!mlServiceEnabled) {
            log.warn("ML Service is disabled, returning fallback response");
            return createFallbackResponse();
        }
        
        try {
            log.debug("Calling ML service: POST {}/predict-risk", mlServiceUrl);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
            
            HttpEntity<RiskPredictionRequest> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<RiskPredictionResponse> response = restTemplate.postForEntity(
                    mlServiceUrl + "/predict-risk",
                    entity,
                    RiskPredictionResponse.class
            );
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("ML prediction successful: risk_score={}, level={}",
                        response.getBody().getRiskScore(),
                        response.getBody().getRiskLevel());
                return response.getBody();
            } else {
                log.warn("ML service returned non-2xx status: {}", response.getStatusCode());
                return createFallbackResponse();
            }
            
        } catch (RestClientException e) {
            log.error("ML service call failed, using fallback: {}", e.getMessage());
            return createFallbackResponse();
        }
    }
    
    /**
     * Check if ML service is healthy and available.
     * 
     * @return true if service is reachable
     */
    public boolean isHealthy() {
        if (!mlServiceEnabled) {
            return false;
        }
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    mlServiceUrl + "/health",
                    String.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Create fallback response when ML service is unavailable.
     * 
     * Returns a conservative medium-risk response.
     */
    private RiskPredictionResponse createFallbackResponse() {
        return RiskPredictionResponse.builder()
                .riskScore(5.0)
                .riskLevel("MEDIUM")
                .confidence(0.5)
                .factors(Arrays.asList(
                        "ML service unavailable - conservative estimate",
                        "Manual review recommended"
                ))
                .modelType("FALLBACK")
                .timestamp(java.time.Instant.now().toString())
                .build();
    }
}