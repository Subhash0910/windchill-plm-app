package com.windchill.common.dto;

public class PaginationRequest {
    private int page = 0;
    private int size = 20;
    private String sortBy = "id";
    private String sortDir = "desc";

    public int getPage() { return page; }
    public void setPage(int page) { this.page = Math.max(0, page); }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = Math.min(Math.max(1, size), 100); }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public String getSortDir() { return sortDir; }
    public void setSortDir(String sortDir) { this.sortDir = "asc".equalsIgnoreCase(sortDir) ? "asc" : "desc"; }
}
