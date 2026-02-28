package com.windchill.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

/**
 * Results from graph-based structural analysis.
 * Contains BOM and where-used traversal data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphImpactResult {

    // Where-used analysis
    private List<AffectedPartInfo> affectedParts;
    private int totalAffectedCount;
    private int releasedAffectedCount;
    private int underReviewCount;

    // BOM analysis
    private int bomDepth;
    private int totalBomItems;
    private boolean hasComplexStructure;

    // Conflicts
    private int conflictingChangesCount;
    private List<String> conflictingChangeNumbers;

    // Compliance
    private boolean hasComplianceIssues;
    private List<String> complianceWarnings;

    // Current state
    private String currentLifecycleState;
    private String currentVersion;

    // Complexity score (0-10)
    private double structuralComplexity;

    /**
     * Information about a single affected part.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AffectedPartInfo {
        private Long partId;
        private String partNumber;
        private String name;
        private String lifecycleState;
        private String version;
        private String relationshipType; // PARENT, CHILD, REFERENCE
        private boolean isReleased;
        private boolean hasActiveChange;
    }
}