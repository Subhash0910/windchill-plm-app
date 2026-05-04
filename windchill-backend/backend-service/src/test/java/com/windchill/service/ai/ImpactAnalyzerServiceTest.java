package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.Part;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.dto.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImpactAnalyzerServiceTest {

    @Mock GraphAnalysisService graphAnalysisService;
    @Mock MLServiceClient      mlServiceClient;
    @Mock PartRepository       partRepository;
    @InjectMocks ImpactAnalyzerService service;

    private Part inworkPart;
    private Part releasedPart;
    private ImpactAnalysisRequest request;

    @BeforeEach
    void setUp() {
        inworkPart = part(1L, "P-001", LifecycleStateEnum.INWORK);
        releasedPart = part(2L, "P-002", LifecycleStateEnum.RELEASED);

        request = ImpactAnalysisRequest.builder()
            .partId(1L).changeType("MODIFY").userId(99L).build();
    }

    // ─── analyzeChange — happy paths ────────────────────────────────────────

    @Nested @DisplayName("analyzeChange()")
    class AnalyzeChange {

        @Test @DisplayName("returns full response when ML service is available")
        void mlAvailable() {
            GraphImpactResult graph = graphResult(3, 1, 2, false, false);
            RiskPredictionResponse mlResponse = RiskPredictionResponse.builder()
                .riskScore(4.0).riskLevel("MEDIUM").confidence(0.9).build();

            when(partRepository.findById(1L)).thenReturn(Optional.of(inworkPart));
            when(graphAnalysisService.analyzePartChange(1L, "MODIFY")).thenReturn(graph);
            when(mlServiceClient.predictRisk(any())).thenReturn(mlResponse);

            ImpactAnalysisResponse response = service.analyzeChange(request);

            assertThat(response.getPartId()).isEqualTo(1L);
            assertThat(response.getPartNumber()).isEqualTo("P-001");
            assertThat(response.getRiskPrediction().getRiskLevel()).isEqualTo("MEDIUM");
            assertThat(response.getAnalyzedAt()).isNotNull();
            assertThat(response.getImpactSummary()).contains("P-001");
        }

        @Test @DisplayName("uses rule-based fallback when ML service throws")
        void mlFallback() {
            GraphImpactResult graph = graphResult(0, 0, 1, false, false);

            when(partRepository.findById(1L)).thenReturn(Optional.of(inworkPart));
            when(graphAnalysisService.analyzePartChange(1L, "MODIFY")).thenReturn(graph);
            when(mlServiceClient.predictRisk(any())).thenThrow(new RuntimeException("ML down"));

            ImpactAnalysisResponse response = service.analyzeChange(request);

            // Rule-based: 0 released, 0 total >5, depth 1 — score=0 → LOW
            assertThat(response.getRiskPrediction().getRiskLevel()).isEqualTo("LOW");
            assertThat(response.getRiskPrediction().getConfidence()).isEqualTo(0.75);
        }

        @Test @DisplayName("propagates ResourceNotFoundException when part is missing")
        void partNotFound() {
            when(partRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.analyzeChange(request))
                .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test @DisplayName("includes graph analysis in response")
        void graphResultIncluded() {
            GraphImpactResult graph = graphResult(5, 2, 3, false, false);
            when(partRepository.findById(1L)).thenReturn(Optional.of(inworkPart));
            when(graphAnalysisService.analyzePartChange(1L, "MODIFY")).thenReturn(graph);
            when(mlServiceClient.predictRisk(any())).thenReturn(
                RiskPredictionResponse.builder().riskScore(3.0).riskLevel("LOW").confidence(0.8).build());

            ImpactAnalysisResponse response = service.analyzeChange(request);

            assertThat(response.getGraphAnalysis().getTotalAffectedCount()).isEqualTo(5);
            assertThat(response.getGraphAnalysis().getReleasedAffectedCount()).isEqualTo(2);
        }
    }

    // ─── fallback risk scoring ───────────────────────────────────────────────

    @Nested @DisplayName("fallback risk scoring")
    class FallbackRiskScoring {

        @Test @DisplayName("LOW risk: no affected parts, shallow BOM, INWORK")
        void lowRisk() {
            assertFallbackLevel(inworkPart, 0, 0, 1, "LOW");
        }

        @Test @DisplayName("MEDIUM risk: a few released parts + moderate total")
        void mediumRisk() {
            // releasedAffected=3 → +2, total=6 → +1, depth=2 → 0 = score 3 → LOW
            // let's get MEDIUM: releasedAffected=6 → +3, total=6 → +1 = 4 → MEDIUM
            assertFallbackLevel(inworkPart, 6, 6, 2, "MEDIUM");
        }

        @Test @DisplayName("HIGH risk: many released + large total + deep BOM")
        void highRisk() {
            // released=11→+4, total=25→+3, depth=6→+2 = 9 → HIGH
            assertFallbackLevel(inworkPart, 11, 25, 6, "HIGH");
        }

        @Test @DisplayName("RELEASED part lifecycle adds 1 to score")
        void releasedPartAddsToScore() {
            // released state +1, otherwise nothing → LOW still (score=1)
            assertFallbackLevel(releasedPart, 0, 0, 1, "LOW");
        }

        @Test @DisplayName("RELEASED part + released affected + deep BOM crosses MEDIUM threshold")
        void releasedPartPushesToMedium() {
            // released state+1, releasedAffected=3→+2, depth=4→+1 = 4 → MEDIUM
            assertFallbackLevel(releasedPart, 3, 3, 4, "MEDIUM");
        }

        private void assertFallbackLevel(Part p, int releasedAffected, int totalAffected,
                                         int depth, String expectedLevel) {
            ImpactAnalysisRequest req = ImpactAnalysisRequest.builder()
                .partId(p.getId()).changeType("MODIFY").build();
            GraphImpactResult graph = graphResult(totalAffected, releasedAffected, depth, false, false);

            when(partRepository.findById(p.getId())).thenReturn(Optional.of(p));
            when(graphAnalysisService.analyzePartChange(p.getId(), "MODIFY")).thenReturn(graph);
            when(mlServiceClient.predictRisk(any())).thenThrow(new RuntimeException("ML unavailable"));

            ImpactAnalysisResponse response = service.analyzeChange(req);
            assertThat(response.getRiskPrediction().getRiskLevel()).isEqualTo(expectedLevel);
        }
    }

    // ─── warnings ────────────────────────────────────────────────────────────

    @Nested @DisplayName("warning generation")
    class Warnings {

        @Test @DisplayName("warns when released parts are affected")
        void releasedPartsWarning() {
            List<String> warnings = runAndGetWarnings(
                inworkPart, graphResult(1, 1, 1, false, false));
            assertThat(warnings).anyMatch(w -> w.contains("released part"));
        }

        @Test @DisplayName("warns about conflicting changes")
        void conflictingChangesWarning() {
            GraphImpactResult graph = GraphImpactResult.builder()
                .totalAffectedCount(0).releasedAffectedCount(0).bomDepth(1)
                .conflictingChangesCount(2).conflictingChangeNumbers(List.of("ECR-001", "ECR-002"))
                .hasComplianceIssues(false).structuralComplexity(0).build();
            List<String> warnings = runAndGetWarnings(inworkPart, graph);
            assertThat(warnings).anyMatch(w -> w.contains("conflicting change"));
        }

        @Test @DisplayName("warns on deep BOM (depth > 5)")
        void deepBomWarning() {
            List<String> warnings = runAndGetWarnings(
                inworkPart, graphResult(0, 0, 6, false, false));
            assertThat(warnings).anyMatch(w -> w.contains("Deep BOM"));
        }

        @Test @DisplayName("warns on large impact scope (> 20 parts)")
        void largeScopeWarning() {
            List<String> warnings = runAndGetWarnings(
                inworkPart, graphResult(21, 0, 1, false, false));
            assertThat(warnings).anyMatch(w -> w.contains("Large impact scope"));
        }

        @Test @DisplayName("warns when changing a RELEASED part — ECN required")
        void releasedPartEcnWarning() {
            List<String> warnings = runAndGetWarnings(
                releasedPart, graphResult(0, 0, 1, false, false));
            assertThat(warnings).anyMatch(w -> w.contains("ECN required"));
        }

        @Test @DisplayName("no warnings for clean INWORK leaf part")
        void noWarningsForCleanPart() {
            List<String> warnings = runAndGetWarnings(
                inworkPart, graphResult(0, 0, 1, false, false));
            assertThat(warnings).isEmpty();
        }
    }

    // ─── blockers ────────────────────────────────────────────────────────────

    @Nested @DisplayName("blocker generation")
    class Blockers {

        @Test @DisplayName("blocker raised when conflicting change numbers present")
        void conflictingChanges() {
            GraphImpactResult graph = GraphImpactResult.builder()
                .totalAffectedCount(0).releasedAffectedCount(0).bomDepth(1)
                .conflictingChangesCount(1).conflictingChangeNumbers(List.of("ECR-042"))
                .hasComplianceIssues(false).structuralComplexity(0).build();
            List<String> blockers = runAndGetBlockers(inworkPart, graph);
            assertThat(blockers).anyMatch(b -> b.contains("BLOCKER") && b.contains("ECR-042"));
        }

        @Test @DisplayName("blocker raised on compliance issues")
        void complianceIssues() {
            GraphImpactResult graph = GraphImpactResult.builder()
                .totalAffectedCount(0).releasedAffectedCount(0).bomDepth(1)
                .conflictingChangesCount(0).conflictingChangeNumbers(Collections.emptyList())
                .hasComplianceIssues(true).structuralComplexity(0).build();
            List<String> blockers = runAndGetBlockers(inworkPart, graph);
            assertThat(blockers).anyMatch(b -> b.contains("BLOCKER") && b.contains("Compliance"));
        }

        @Test @DisplayName("no blockers on clean graph")
        void noBlockers() {
            List<String> blockers = runAndGetBlockers(
                inworkPart, graphResult(0, 0, 1, false, false));
            assertThat(blockers).isEmpty();
        }
    }

    // ─── recommendations ─────────────────────────────────────────────────────

    @Nested @DisplayName("recommendation generation")
    class Recommendations {

        @Test @DisplayName("HIGH risk triggers senior review recommendation")
        void highRiskRecommendation() {
            List<String> recs = runAndGetRecommendations(
                inworkPart, graphResult(11, 11, 6, false, false));
            assertThat(recs).anyMatch(r -> r.contains("senior engineer"));
        }

        @Test @DisplayName("LOW risk recommends standard process")
        void lowRiskRecommendation() {
            List<String> recs = runAndGetRecommendations(
                inworkPart, graphResult(0, 0, 1, false, false));
            assertThat(recs).anyMatch(r -> r.contains("standard process"));
        }

        @Test @DisplayName("many released parts triggers PM notification recommendation")
        void manyReleasedPartsNotifyPm() {
            List<String> recs = runAndGetRecommendations(
                inworkPart, graphResult(10, 6, 2, false, false));
            assertThat(recs).anyMatch(r -> r.contains("product management"));
        }
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private List<String> runAndGetWarnings(Part p, GraphImpactResult graph) {
        return runAnalysis(p, graph).getWarnings();
    }

    private List<String> runAndGetBlockers(Part p, GraphImpactResult graph) {
        return runAnalysis(p, graph).getBlockers();
    }

    private List<String> runAndGetRecommendations(Part p, GraphImpactResult graph) {
        return runAnalysis(p, graph).getRecommendations();
    }

    private ImpactAnalysisResponse runAnalysis(Part p, GraphImpactResult graph) {
        ImpactAnalysisRequest req = ImpactAnalysisRequest.builder()
            .partId(p.getId()).changeType("MODIFY").build();
        when(partRepository.findById(p.getId())).thenReturn(Optional.of(p));
        when(graphAnalysisService.analyzePartChange(p.getId(), "MODIFY")).thenReturn(graph);
        when(mlServiceClient.predictRisk(any())).thenThrow(new RuntimeException("ML unavailable"));
        return service.analyzeChange(req);
    }

    private static GraphImpactResult graphResult(int total, int released, int depth,
                                                  boolean compliance, boolean complex) {
        return GraphImpactResult.builder()
            .totalAffectedCount(total)
            .releasedAffectedCount(released)
            .bomDepth(depth)
            .conflictingChangesCount(0)
            .conflictingChangeNumbers(Collections.emptyList())
            .hasComplianceIssues(compliance)
            .hasComplexStructure(complex)
            .currentLifecycleState("INWORK")
            .currentVersion("A.1")
            .structuralComplexity(0)
            .build();
    }

    private static Part part(Long id, String partNumber, LifecycleStateEnum state) {
        Part p = new Part();
        p.setId(id);
        p.setPartNumber(partNumber);
        p.setName("Part " + partNumber);
        p.setLifecycleState(state);
        p.setRevision("A");
        p.setIteration(1);
        return p;
    }
}
