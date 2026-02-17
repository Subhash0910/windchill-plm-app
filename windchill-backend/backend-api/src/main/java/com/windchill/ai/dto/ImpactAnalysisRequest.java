package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import javax.validation.constraints.NotNull;

/**
 * Request DTO for impact analysis.
 * Contains information about a proposed engineering change.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactAnalysisRequest {

    @NotNull(message = "Part ID is required")
    private Long partId;

    @NotNull(message = "Change type is required")
    private String changeType; // OBSOLETE, REVISE, PROMOTE, etc.

    private String proposedState; // Target lifecycle state if applicable

    private String description; // Optional change description

    private Long userId; // User requesting the change
}