package com.windchill.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> content;  // page content
    private int page;  // current page (0-based)
    private int pageSize;  // items per page
    private long totalElements;  // total items in DB
    private int totalPages;  // total pages
    private boolean first;  // is first page
    private boolean last;  // is last page
    private boolean hasNext;  // has next page
    private boolean hasPrevious;  // has previous page

    public static <T> PaginatedResponse<T> of(List<T> content, int page, int pageSize, long totalElements) {
        int totalPages = (int) Math.ceil((double) totalElements / pageSize);
        return new PaginatedResponse<>(
            content,
            page,
            pageSize,
            totalElements,
            totalPages,
            page == 0,
            page >= totalPages - 1,
            page < totalPages - 1,
            page > 0
        );
    }
}
