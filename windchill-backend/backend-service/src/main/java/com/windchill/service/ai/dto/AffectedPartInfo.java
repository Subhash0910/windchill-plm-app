package com.windchill.service.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AffectedPartInfo {
    private Long partId;
    private String partNumber;
    private String name;
    private String lifecycleState;
    private String version;
    private String changeImpact;
    private Integer depth;
}
