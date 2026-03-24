package com.windchill.api.dto.change;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Request body for POST /api/v1/plm/changes
 */
@Data
public class CreateChangeRequestRequest {

    @NotNull(message = "contextId is required")
    private Long contextId;

    @NotBlank(message = "title is required")
    private String title;

    private String description;

    private String reason;

    /** LOW | NORMAL | HIGH | CRITICAL — defaults to NORMAL if omitted */
    private String priority;

    /** IDs of the parts this change request impacts */
    private List<Long> impactedPartIds;
}
