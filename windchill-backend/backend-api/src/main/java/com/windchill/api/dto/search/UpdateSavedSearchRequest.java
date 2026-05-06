package com.windchill.api.dto.search;

import lombok.Data;

@Data
public class UpdateSavedSearchRequest {
    private String name;
    private String queryJson;
    private Boolean isPublic;
    private String sortBy;
    private String sortDir;
}
