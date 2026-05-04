package com.windchill.service.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ImpactAnalysisRequest {
    @NotNull  private Long partId;
    @NotBlank private String changeType;
    private String proposedState;
    private String description;
    private Long userId;
}
