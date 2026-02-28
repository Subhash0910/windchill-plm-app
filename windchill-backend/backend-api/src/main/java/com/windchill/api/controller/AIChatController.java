package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.service.ai.IAIChatService;
import com.windchill.service.ai.dto.AIChatRequest;
import com.windchill.service.ai.dto.AIChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AI Chat Assistant Controller
 * 
 * Provides natural language interface for PLM operations
 */
@RestController
@RequestMapping("/api/v1/ai/chat")
@RequiredArgsConstructor
@Slf4j
public class AIChatController {

    private final IAIChatService chatService;

    /**
     * Send message to AI assistant
     * 
     * POST /api/v1/ai/chat
     * 
     * Request Body:
     * {
     *   "message": "What's the risk of obsoleting part 001dfy?",
     *   "context": {
     *     "part_number": "001dfy",
     *     "change_type": "OBSOLETE"
     *   },
     *   "sessionId": "optional-session-id"
     * }
     * 
     * Response:
     * {
     *   "success": true,
     *   "data": {
     *     "text": "AI response...",
     *     "actions": ["RUN_IMPACT_ANALYSIS"],
     *     "actionParams": {"part_number": "001dfy"},
     *     "suggestions": ["Show affected parts", "Create ECN"]
     *   }
     * }
     */
    @PostMapping
    public ResponseEntity<ApiResponse<?>> chat(@RequestBody AIChatRequest request) {
        log.info("💬 Chat request: {}", request.getMessage());
        
        try {
            AIChatResponse response = chatService.chat(request);
            
            return ResponseEntity.ok(
                ApiResponse.builder()
                    .success(true)
                    .message("Chat response generated successfully")
                    .data(response)
                    .build()
            );
            
        } catch (Exception e) {
            log.error("❌ Chat failed: {}", e.getMessage(), e);
            
            return ResponseEntity.ok(
                ApiResponse.builder()
                    .success(false)
                    .message("Chat service unavailable: " + e.getMessage())
                    .data(null)
                    .build()
            );
        }
    }

    /**
     * Clear conversation context
     * 
     * POST /api/v1/ai/chat/clear
     */
    @PostMapping("/clear")
    public ResponseEntity<ApiResponse<?>> clearContext() {
        log.info("🧹 Clearing chat context");
        
        try {
            chatService.clearContext();
            
            return ResponseEntity.ok(
                ApiResponse.builder()
                    .success(true)
                    .message("Chat context cleared")
                    .data(null)
                    .build()
            );
            
        } catch (Exception e) {
            log.warn("Failed to clear context: {}", e.getMessage());
            
            return ResponseEntity.ok(
                ApiResponse.builder()
                    .success(false)
                    .message("Failed to clear context")
                    .data(null)
                    .build()
            );
        }
    }
}
