package com.windchill.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a part affected by a change.
 * 
 * From where-used analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AffectedPart {
    
    private Long id;
    private String number;
    private String name;
    private String lifecycleState;
    private String relationshipType;  // PARENT, CHILD, SIBLING
    private Integer depth;  // Distance from source part
    private Boolean hasActiveChanges;  // Conflict indicator
    private String activeChangeId;  // ECR/ECN number if exists
}
