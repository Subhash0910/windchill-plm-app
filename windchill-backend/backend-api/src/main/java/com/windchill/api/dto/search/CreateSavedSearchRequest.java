package com.windchill.api.dto.search;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateSavedSearchRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Entity type is required")
    private String entityType;

    private String queryJson;

    private Boolean isPublic = false;

    private String sortBy;

    private String sortDir;
}
