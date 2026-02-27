package com.windchill.service.ai;

import com.windchill.service.ai.dto.AIChatRequest;
import com.windchill.service.ai.dto.AIChatResponse;

/**
 * AI Chat Service Interface
 * 
 * Provides natural language interface for PLM operations
 */
public interface IAIChatService {
    
    /**
     * Send message to AI chat assistant
     * 
     * @param request Chat request with message and context
     * @return AI response with text, actions, and suggestions
     */
    AIChatResponse chat(AIChatRequest request);
    
    /**
     * Clear conversation history
     */
    void clearContext();
}
