package com.windchill.change.api.dto;

import com.windchill.change.impact.domain.ImpactRouteDecision;
import com.windchill.change.impact.domain.ImpactSimilarChange;

import java.util.List;

public class ChangeInsightsResponse {

    private ImpactReportResponse impact;
    private List<ImpactSimilarChange> similar;
    private ImpactRouteDecision route;

    public ChangeInsightsResponse() {
    }

    public ChangeInsightsResponse(ImpactReportResponse impact, List<ImpactSimilarChange> similar, ImpactRouteDecision route) {
        this.impact = impact;
        this.similar = similar;
        this.route = route;
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

    public ImpactRouteDecision getRoute() {
        return route;
    }

    public void setRoute(ImpactRouteDecision route) {
        this.route = route;
    }
}
