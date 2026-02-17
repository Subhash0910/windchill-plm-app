package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for impact analysis.
 * Contains information about a proposed engineering change.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImpactAnalysisRequest {

    private Long partId;

    private String changeType; // OBSOLETE, REVISE, PROMOTE, etc.

    private String proposedState; // Target lifecycle state if applicable

    private String description; // Optional change description

    private Long userId; // User requesting the change
}