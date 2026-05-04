package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GraphImpactResult {

    private List<AffectedPartInfo> affectedParts;
    private int totalAffectedCount;
    private int releasedAffectedCount;
    private int underReviewCount;

    private int bomDepth;
    private int totalBomItems;
    private boolean hasComplexStructure;

    private int conflictingChangesCount;
    private List<String> conflictingChangeNumbers;

    private boolean hasComplianceIssues;
    private List<String> complianceWarnings;

    private String currentLifecycleState;
    private String currentVersion;
    private double structuralComplexity;
}
