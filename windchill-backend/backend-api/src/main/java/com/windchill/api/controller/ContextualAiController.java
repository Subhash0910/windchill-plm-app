package com.windchill.api.controller;

import com.windchill.api.dto.ai.ContextualAiResponseDto;
import com.windchill.api.service.ContextualAiService;
import com.windchill.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/contextual")
@RequiredArgsConstructor
public class ContextualAiController {

    private final ContextualAiService contextualAiService;

    @GetMapping("/parts/{partId}")
    public ResponseEntity<ApiResponse<ContextualAiResponseDto>> getPartGuidance(@PathVariable Long partId) {
        return ResponseEntity.ok(ApiResponse.success(contextualAiService.getPartGuidance(partId)));
    }

    @GetMapping("/ecrs/{ecrId}")
    public ResponseEntity<ApiResponse<ContextualAiResponseDto>> getEcrReview(@PathVariable Long ecrId) {
        return ResponseEntity.ok(ApiResponse.success(contextualAiService.getEcrReviewSummary(ecrId)));
    }

    @GetMapping("/workitems/{workItemId}")
    public ResponseEntity<ApiResponse<ContextualAiResponseDto>> getWorkItemSummary(@PathVariable Long workItemId) {
        return ResponseEntity.ok(ApiResponse.success(contextualAiService.getWorkItemSummary(workItemId)));
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<ApiResponse<ContextualAiResponseDto>> getDocumentGuidance(@PathVariable Long documentId) {
        return ResponseEntity.ok(ApiResponse.success(contextualAiService.getDocumentGuidance(documentId)));
    }
}
