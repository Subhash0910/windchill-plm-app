package com.windchill.service.ai;

import com.windchill.service.ai.dto.AIChatRequest;
import com.windchill.service.ai.dto.AIChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI Chat Service Implementation
 * 
 * Integrates with Python ML service for natural language processing
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIChatServiceImpl implements IAIChatService {

    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://ml-service:5000}")
    private String mlServiceUrl;

    @Override
    public AIChatResponse chat(AIChatRequest request) {
        log.info("💬 AI Chat request: {}", request.getMessage());
        
        try {
            // Prepare request for Python service
            Map<String, Object> mlRequest = new HashMap<>();
            mlRequest.put("message", request.getMessage());
            mlRequest.put("context", request.getContext());
            mlRequest.put("session_id", request.getSessionId());
            
            // Call ML service
            ResponseEntity<AIChatResponse> response = restTemplate.postForEntity(
                mlServiceUrl + "/chat",
                mlRequest,
                AIChatResponse.class
            );
            
            AIChatResponse chatResponse = response.getBody();
            log.info("✅ Chat response received: {} chars", 
                chatResponse != null ? chatResponse.getText().length() : 0);
            
            return chatResponse;
            
        } catch (Exception e) {
            log.error("❌ Chat service failed: {}", e.getMessage(), e);
            
            // Fallback response
            return AIChatResponse.builder()
                .text("I'm having trouble connecting to my AI brain right now. " +
                      "Please try refreshing the page or contact support if the issue persists.")
                .suggestions(List.of(
                    "Check connection",
                    "Try again",
                    "Contact support"
                ))
                .build();
        }
    }

    @Override
    public void clearContext() {
        try {
            restTemplate.postForEntity(
                mlServiceUrl + "/chat/clear",
                null,
                Map.class
            );
            log.info("🧹 Chat context cleared");
        } catch (Exception e) {
            log.warn("Failed to clear chat context: {}", e.getMessage());
        }
    }
}
