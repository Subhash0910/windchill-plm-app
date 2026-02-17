package com.windchill.change.api.dto;

import com.windchill.change.impact.service.ChangeSimilarityService;

import java.util.List;

public class ChangeInsightsResponse {

    private ImpactReportResponse impact;
    private List<ChangeSimilarityService.SimilarChange> similar;

    public ChangeInsightsResponse() {
    }

    public ChangeInsightsResponse(ImpactReportResponse impact, List<ChangeSimilarityService.SimilarChange> similar) {
        this.impact = impact;
        this.similar = similar;
    }

    public ImpactReportResponse getImpact() {
        return impact;
    }

    public void setImpact(ImpactReportResponse impact) {
        this.impact = impact;
    }

    public List<ChangeSimilarityService.SimilarChange> getSimilar() {
        return similar;
    }

    public void setSimilar(List<ChangeSimilarityService.SimilarChange> similar) {
        this.similar = similar;
    }
}
