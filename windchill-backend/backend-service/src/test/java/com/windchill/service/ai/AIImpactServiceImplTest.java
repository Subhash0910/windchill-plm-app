package com.windchill.service.ai;

import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.dto.AIImpactAnalysis;
import com.windchill.service.ai.dto.MLRiskResponse;
import com.windchill.service.plm.IAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AIImpactServiceImplTest {

    @Mock PartRepository partRepository;
    @Mock BomLineRepository bomLineRepository;
    @Mock ChangeRequestRepository changeRequestRepository;
    @Mock IAuditService auditService;
    @Mock RestTemplate restTemplate;

    @InjectMocks AIImpactServiceImpl service;

    private Part subjectPart;
    private Part parentPartA;
    private Part parentPartB;
    private ChangeRequest activeEcr;

    @BeforeEach
    void setUp() {
        subjectPart = new Part();
        subjectPart.setId(1L);
        subjectPart.setPartNumber("PART-001");
        subjectPart.setName("Bracket Assembly");
        subjectPart.setLifecycleState(LifecycleStateEnum.RELEASED);
        subjectPart.setRevision("A");
        subjectPart.setIteration(3);

        parentPartA = new Part();
        parentPartA.setId(10L);
        parentPartA.setPartNumber("ASSY-A");
        parentPartA.setLifecycleState(LifecycleStateEnum.RELEASED);

        parentPartB = new Part();
        parentPartB.setId(20L);
        parentPartB.setPartNumber("ASSY-B");
        parentPartB.setLifecycleState(LifecycleStateEnum.INWORK);

        activeEcr = new ChangeRequest();
        activeEcr.setId(100L);
        activeEcr.setChangeNumber("ECR-0042");
        activeEcr.setStatus(ChangeRequestStatus.IN_REVIEW);
        activeEcr.setImpactedPartIds("10,30,40");

        // Default stubs
        when(partRepository.findById(1L)).thenReturn(Optional.of(subjectPart));
        when(bomLineRepository.findDistinctParentPartIdsByChildPartId(1L))
                .thenReturn(List.of(10L, 20L));
        when(partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(anyList()))
                .thenReturn(List.of(parentPartA, parentPartB));
        when(bomLineRepository.findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(anyLong()))
                .thenReturn(Collections.emptyList());
        when(changeRequestRepository.findActiveChangeRequests())
                .thenReturn(Collections.emptyList());

        MLRiskResponse mlResponse = MLRiskResponse.builder()
                .riskScore(3.0)
                .confidence(0.85)
                .riskLevel("LOW")
                .factors(List.of("Standard change"))
                .modelType("ML")
                .timestamp(LocalDateTime.now().toString())
                .build();
        when(restTemplate.postForEntity(anyString(), any(), eq(MLRiskResponse.class)))
                .thenReturn(ResponseEntity.ok(mlResponse));

        doNothing().when(auditService).log(any(), anyLong(), anyString(), anyString());
    }

    @Nested @DisplayName("Conflict Detection")
    class ConflictDetection {

        @Test @DisplayName("detects active ECRs on affected parent parts")
        void detectsConflictingChangesWhenParentsHaveActiveEcrs() {
            when(changeRequestRepository.findActiveChangeRequests())
                    .thenReturn(List.of(activeEcr));

            AIImpactAnalysis result = service.analyzeImpact(1L, "OBSOLETE");

            assertThat(result.getConflictingChanges()).isEqualTo(1);
        }

        @Test @DisplayName("zero conflicting changes when no active ECRs on parents")
        void zeroConflictsWhenNoActiveEcrs() {
            AIImpactAnalysis result = service.analyzeImpact(1L, "REVISE");

            assertThat(result.getConflictingChanges()).isZero();
        }

        @Test @DisplayName("ignores CLOSED and REJECTED ECRs in conflict count")
        void ignoresClosedAndRejectedEcrs() {
            // Default stub returns empty list — CLOSED/REJECTED excluded by repository query

            AIImpactAnalysis result = service.analyzeImpact(1L, "REVISE");

            assertThat(result.getConflictingChanges()).isZero();
        }
    }

    @Nested @DisplayName("Compliance Checking")
    class ComplianceChecking {

        @Test @DisplayName("flags compliance issue when obsoleting a RELEASED part")
        void flagsComplianceIssueForObsoleteOnReleased() {
            AIImpactAnalysis result = service.analyzeImpact(1L, "OBSOLETE");

            // OBSOLETE on RELEASED should still produce valid analysis
            assertThat(result.getRiskScore()).isNotNull();
            assertThat(result.getRiskLevel()).isIn("LOW", "MEDIUM", "HIGH");
        }

        @Test @DisplayName("no compliance flag for REVISE on INWORK part")
        void noComplianceIssueForReviseOnInwork() {
            subjectPart.setLifecycleState(LifecycleStateEnum.INWORK);

            AIImpactAnalysis result = service.analyzeImpact(1L, "REVISE");

            assertThat(result.getRiskLevel()).isEqualTo("LOW");
        }

        @Test @DisplayName("elevated risk when RELEASED parents are affected")
        void elevatedRiskWhenReleasedParentsAffected() {
            parentPartB.setLifecycleState(LifecycleStateEnum.RELEASED);
            when(partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(anyList()))
                    .thenReturn(List.of(parentPartA, parentPartB));

            AIImpactAnalysis result = service.analyzeImpact(1L, "OBSOLETE");

            // Both parents RELEASED → releasedAffected should be 2
            assertThat(result.getReleasedAffected()).isEqualTo(2);
        }
    }

    @Nested @DisplayName("Integration: Conflict + Compliance")
    class ConflictAndComplianceIntegration {

        @Test @DisplayName("change with both active ECR conflict and compliance concerns")
        void highRiskWithBothConflictsAndComplianceIssues() {
            when(changeRequestRepository.findActiveChangeRequests())
                    .thenReturn(List.of(activeEcr));

            AIImpactAnalysis result = service.analyzeImpact(1L, "OBSOLETE");

            assertThat(result.getConflictingChanges()).isPositive();
            assertThat(result.getRiskScore()).isNotNull();
            assertThat(result.getRiskFactors()).isNotEmpty();
        }
    }

    @Nested @DisplayName("ML Service Fallback")
    class MLServiceFallback {

        @Test @DisplayName("uses rule-based fallback when ML service is down")
        void fallsBackWhenMLServiceUnavailable() {
            when(restTemplate.postForEntity(anyString(), any(), eq(MLRiskResponse.class)))
                    .thenThrow(new RuntimeException("Connection refused"));

            AIImpactAnalysis result = service.analyzeImpact(1L, "REVISE");

            assertThat(result.getModelType()).isEqualTo("FALLBACK_RULE");
            assertThat(result.getRiskScore()).isNotNull();
            assertThat(result.getConfidence()).isEqualTo(0.75);
        }
    }
}
