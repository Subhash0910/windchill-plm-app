package com.windchill.change.api.dto;

import com.windchill.change.impact.domain.ImpactSimilarChange;

import java.util.List;

public class ChangeInsightsResponse {

    private ImpactReportResponse impact;
    private List<ImpactSimilarChange> similar;

    public ChangeInsightsResponse() {
    }

    public ChangeInsightsResponse(ImpactReportResponse impact, List<ImpactSimilarChange> similar) {
        this.impact = impact;
        this.similar = similar;
    }

    public ImpactReportResponse getImpact() {
        return impact;
    }

    public void setImpact(ImpactReportResponse impact) {
        this.impact = impact;
    }

    public List<ImpactSimilarChange> getSimilar() {
        return similar;
    }

    public void setSimilar(List<ImpactSimilarChange> similar) {
        this.similar = similar;
    }
}
