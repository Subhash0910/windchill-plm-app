package com.windchill.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginationRequest {
    private int page = 0;  // 0-based page number
    private int pageSize = 20;  // items per page
    private String sortBy = "id";  // field to sort by
    private String sortOrder = "ASC";  // ASC or DESC

    public int getOffset() {
        return page * pageSize;
    }
}
