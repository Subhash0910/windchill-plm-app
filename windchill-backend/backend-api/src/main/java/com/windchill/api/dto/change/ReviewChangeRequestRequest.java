package com.windchill.api.dto.change;

import lombok.Data;

/**
 * Request body for approve / reject endpoints.
 */
@Data
public class ReviewChangeRequestRequest {
    private String comment;
}
