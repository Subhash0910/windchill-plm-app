package com.windchill.change.api;

import com.windchill.change.api.dto.ChangeInsightsResponse;
import com.windchill.change.api.dto.ImpactReportResponse;
import com.windchill.change.impact.domain.ImpactItem;
import com.windchill.change.impact.domain.ImpactReport;
import com.windchill.change.impact.domain.ImpactSimilarChange;
import com.windchill.change.impact.service.ChangeImpactAnalysisService;
import com.windchill.change.impact.service.ChangeInsightsSnapshotService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/changes/ecr")
public class ChangeInsightsController {

    private final ChangeImpactAnalysisService changeImpactAnalysisService;
    private final ChangeInsightsSnapshotService changeInsightsSnapshotService;

    public ChangeInsightsController(ChangeImpactAnalysisService changeImpactAnalysisService,
                                    ChangeInsightsSnapshotService changeInsightsSnapshotService) {
        this.changeImpactAnalysisService = changeImpactAnalysisService;
        this.changeInsightsSnapshotService = changeInsightsSnapshotService;
    }

    @GetMapping("/{id}/insights")
    public ChangeInsightsResponse insights(@PathVariable("id") Long ecrId) {
        ImpactReport report = changeImpactAnalysisService.getLatestReport(ecrId);
        List<ImpactItem> items = changeImpactAnalysisService.getItems(report.getId());
        ImpactReportResponse impact = new ImpactReportResponse(report, items);

        List<ImpactSimilarChange> similar = changeInsightsSnapshotService.ensureSimilaritiesForReport(report.getId(), ecrId, 5);
        return new ChangeInsightsResponse(impact, similar);
    }
}
