package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImpactAnalysisRequest {
    private Long partId;
    private String changeType;
    private String proposedState;
    private String description;
    private Long userId;
}
