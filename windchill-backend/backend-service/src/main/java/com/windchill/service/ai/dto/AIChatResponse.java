package com.windchill.service.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * AI Chat Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private String text;
    
    @JsonProperty("actions")
    private List<String> actions;
    
    @JsonProperty("action_params")
    private Map<String, Object> actionParams;
    
    @JsonProperty("suggestions")
    private List<String> suggestions;
    
    @JsonProperty("timestamp")
    private String timestamp;
}
