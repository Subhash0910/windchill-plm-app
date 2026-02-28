package com.windchill.change.api;

import com.windchill.change.api.dto.ImpactReportResponse;
import com.windchill.change.impact.domain.ImpactItem;
import com.windchill.change.impact.domain.ImpactReport;
import com.windchill.change.impact.service.ChangeImpactAnalysisService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/changes/ecr")
public class ChangeImpactController {

    private final ChangeImpactAnalysisService changeImpactAnalysisService;

    public ChangeImpactController(ChangeImpactAnalysisService changeImpactAnalysisService) {
        this.changeImpactAnalysisService = changeImpactAnalysisService;
    }

    @PostMapping("/{id}/analyze")
    public ImpactReport analyze(@PathVariable("id") Long ecrId) {
        return changeImpactAnalysisService.analyzeForEcr(ecrId);
    }

    @GetMapping("/{id}/impact")
    public ImpactReportResponse getLatest(@PathVariable("id") Long ecrId) {
        ImpactReport report = changeImpactAnalysisService.getLatestReport(ecrId);
        List<ImpactItem> items = changeImpactAnalysisService.getItems(report.getId());
        return new ImpactReportResponse(report, items);
    }
}
