package com.windchill.api.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContextualAiResponseDto {
    @Builder.Default
    private List<ContextualAiFactDto> facts = new ArrayList<>();

    private String assessment;

    @Builder.Default
    private List<String> recommendedActions = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();

    private Integer confidence;
}
