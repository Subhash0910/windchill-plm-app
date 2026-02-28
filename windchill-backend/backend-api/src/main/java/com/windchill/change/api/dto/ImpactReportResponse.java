package com.windchill.change.api.dto;

import com.windchill.change.impact.domain.ImpactItem;
import com.windchill.change.impact.domain.ImpactReport;

import java.util.List;

public class ImpactReportResponse {

    private ImpactReport report;
    private List<ImpactItem> items;

    public ImpactReportResponse() {
    }

    public ImpactReportResponse(ImpactReport report, List<ImpactItem> items) {
        this.report = report;
        this.items = items;
    }

    public ImpactReport getReport() {
        return report;
    }

    public void setReport(ImpactReport report) {
        this.report = report;
    }

    public List<ImpactItem> getItems() {
        return items;
    }

    public void setItems(List<ImpactItem> items) {
        this.items = items;
    }
}
