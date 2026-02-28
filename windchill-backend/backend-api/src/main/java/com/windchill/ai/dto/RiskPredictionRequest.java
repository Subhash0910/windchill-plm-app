package com.windchill.ai.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for ML service risk prediction.
 * Maps to Python FastAPI RiskPredictionRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskPredictionRequest {

    @JsonProperty("part_id")
    private Long partId;

    @JsonProperty("change_type")
    private String changeType;

    @JsonProperty("bom_depth")
    private Integer bomDepth;

    @JsonProperty("where_used_count")
    private Integer whereUsedCount;

    @JsonProperty("released_affected")
    private Integer releasedAffected;

    @JsonProperty("conflicting_changes")
    private Integer conflictingChanges;

    @JsonProperty("lifecycle_state")
    private String lifecycleState;

    @JsonProperty("has_compliance_issues")
    private Boolean hasComplianceIssues;
}