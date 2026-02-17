package com.windchill.ai.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * Detailed information about a part affected by the proposed change.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AffectedPartInfo {
    private Long partId;
    private String partNumber;
    private String name;
    private String lifecycleState;
    private String version;
    private String changeImpact;  // Why this part is affected
    private Integer depth;        // BOM depth from target part
}