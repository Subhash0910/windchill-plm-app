package com.windchill.ai.controller;

import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.service.ai.dto.ImpactAnalysisRequest;
import com.windchill.service.ai.dto.ImpactAnalysisResponse;
import com.windchill.service.ai.ImpactAnalyzerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.windchill.api.security.AuthenticatedUser;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai/impact")
@RequiredArgsConstructor
@Tag(name = "AI Impact Analysis", description = "AI-powered engineering change impact analysis and risk prediction")
public class ImpactAnalysisController {

    private final ImpactAnalyzerService    impactAnalyzerService;
    private final ChangeRequestRepository  changeRequestRepo;

    @PostMapping("/analyze")
    @Operation(
        summary = "Analyze engineering change impact",
        description = "Performs comprehensive impact analysis using graph algorithms and ML risk prediction."
    )
    public ResponseEntity<ImpactAnalysisResponse> analyzeChange(
            @Valid @RequestBody ImpactAnalysisRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {

        log.info("Impact analysis request: partId={}, changeType={}, requestedBy={}",
                request.getPartId(),
                request.getChangeType() != null ? request.getChangeType().replaceAll("[\r\n]", "_") : "null",
                user.getUsername());

        try {
            ImpactAnalysisResponse response = impactAnalyzerService.analyzeChange(request);
            log.info("Impact analysis completed: partId={}, riskLevel={}, riskScore={}",
                    request.getPartId(),
                    response.getRiskPrediction().getRiskLevel(),
                    response.getRiskPrediction().getRiskScore());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Impact analysis failed for partId={}", request.getPartId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/v1/ai/impact/ecr/{ecrId}
     * Analyze all impacted parts for an ECR in one call.
     * Returns per-part analysis + an aggregated summary.
     */
    @GetMapping("/ecr/{ecrId}")
    @Operation(summary = "Analyze all impacted parts for an ECR")
    public ResponseEntity<EcrImpactSummary> analyzeEcr(
            @PathVariable Long ecrId,
            @AuthenticationPrincipal AuthenticatedUser user) {

        ChangeRequest ecr = changeRequestRepo.findById(ecrId)
            .orElseThrow(() -> new ResourceNotFoundException("ECR not found: " + ecrId));

        List<Long> partIds = decodePartIds(ecr.getImpactedPartIds());
        List<ImpactAnalysisResponse> analyses = new ArrayList<>();

        for (Long partId : partIds) {
            try {
                ImpactAnalysisRequest req = new ImpactAnalysisRequest();
                req.setPartId(partId);
                req.setChangeType("MODIFY");
                analyses.add(impactAnalyzerService.analyzeChange(req));
            } catch (Exception ex) {
                log.warn("Could not analyze partId={} for ECR {}: {}", partId, ecrId, ex.getMessage());
            }
        }

        double maxRisk    = analyses.stream().mapToDouble(a -> a.getRiskPrediction().getRiskScore()).max().orElse(0);
        int    totalAffected = analyses.stream().mapToInt(a -> a.getGraphAnalysis().getTotalAffectedCount()).sum();
        List<String> allWarnings     = analyses.stream().flatMap(a -> a.getWarnings().stream()).distinct().collect(Collectors.toList());
        List<String> allBlockers     = analyses.stream().flatMap(a -> a.getBlockers().stream()).distinct().collect(Collectors.toList());
        List<String> allRecs         = analyses.stream().flatMap(a -> a.getRecommendations().stream()).distinct().collect(Collectors.toList());

        String riskLevel = maxRisk >= 7 ? "HIGH" : maxRisk >= 4 ? "MEDIUM" : "LOW";

        return ResponseEntity.ok(new EcrImpactSummary(
            ecrId, ecr.getChangeNumber(), partIds.size(), maxRisk, riskLevel,
            totalAffected, allWarnings, allBlockers, allRecs, analyses
        ));
    }

    private static List<Long> decodePartIds(String encoded) {
        if (encoded == null || encoded.isBlank()) return List.of();
        return Arrays.stream(encoded.split(","))
            .map(String::trim).filter(s -> !s.isEmpty()).map(Long::parseLong)
            .collect(Collectors.toList());
    }

    public record EcrImpactSummary(
        Long ecrId, String ecrNumber, int analyzedPartCount,
        double maxRiskScore, String riskLevel,
        int totalAffectedCount,
        List<String> warnings, List<String> blockers, List<String> recommendations,
        List<ImpactAnalysisResponse> partAnalyses
    ) {}

    @GetMapping("/health")
    @Operation(summary = "AI service health check")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("AI Impact Analysis Service is running");
    }
}
