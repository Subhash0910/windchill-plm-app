package com.windchill.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Graph analysis metrics from BOM/where-used traversal.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphMetrics {
    
    private Integer bomDepth;  // Maximum BOM depth
    private Integer bomWidth;  // Number of direct children
    private Integer bomTotalParts;  // Total parts in BOM tree
    
    private Integer whereUsedCount;  // Number of parent assemblies
    private Integer whereUsedDepth;  // Maximum upward depth
    
    private Integer releasedAffected;  // Released parts that will be impacted
    private Integer underReviewAffected;  // Parts under review
    private Integer conflictingChanges;  // Parts in active ECR/ECN
    
    private Integer structuralComplexity;  // Overall complexity score
}
