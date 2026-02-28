package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLRiskRequest {
    private Long partId;
    private String changeType;
    private Integer bomDepth;
    private Integer whereUsedCount;
    private Integer releasedAffected;
    private Integer conflictingChanges;
    private String lifecycleState;
    private Boolean hasComplianceIssues;
}
