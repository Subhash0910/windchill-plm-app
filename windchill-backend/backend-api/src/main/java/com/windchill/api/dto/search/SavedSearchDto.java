package com.windchill.api.dto.search;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SavedSearchDto {
    private Long id;
    private Long userId;
    private String name;
    private String entityType;
    private String queryJson;
    private Boolean isPublic;
    private String sortBy;
    private String sortDir;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
