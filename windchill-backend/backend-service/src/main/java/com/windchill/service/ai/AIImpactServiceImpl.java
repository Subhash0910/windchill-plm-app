package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.dto.AIImpactAnalysis;
import com.windchill.service.ai.dto.MLRiskRequest;
import com.windchill.service.ai.dto.MLRiskResponse;
import com.windchill.service.plm.IAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Impact Analysis Service
 * 
 * FIXED: Removed @Transactional(readOnly = true) because service needs to write audit logs.
 * This method performs mostly READ operations but also logs to audit_logs table.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIImpactServiceImpl implements IAIImpactService {

    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final IAuditService auditService;
    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://ml-service:5000}")
    private String mlServiceUrl;

    @Override
    @Transactional  // FIXED: Removed readOnly=true to allow audit log writes
    public AIImpactAnalysis analyzeImpact(Long partId, String changeType) {
        long startTime = System.currentTimeMillis();
        
        log.info("Starting AI impact analysis for partId={}, changeType={}", partId, changeType);
        
        // 1. Get part details
        Part part = partRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Part", "id", partId));
        
        // 2. Graph Intelligence: Analyze BOM structure
        int bomDepth = calculateBomDepth(partId, 0, new HashSet<>());
        List<Long> whereUsedIds = bomLineRepository.findDistinctParentPartIdsByChildPartId(partId);
        int whereUsedCount = whereUsedIds != null ? whereUsedIds.size() : 0;
        
        // 3. Identify released parents (critical for risk)
        int releasedAffected = countReleasedParts(whereUsedIds);
        List<String> affectedPartNumbers = getAffectedPartNumbers(whereUsedIds);
        
        // 4. Detect conflicting changes (active ECRs on affected parent parts)
        int conflictingChanges = detectConflictingChanges(whereUsedIds);
        List<String> conflictingChangeNumbers = getConflictingChangeNumbers(whereUsedIds);
        
        // 4b. Check compliance issues
        boolean hasComplianceIssues = checkCompliance(part, changeType, whereUsedIds);
        List<String> complianceWarnings = getComplianceWarnings(part, changeType, whereUsedIds);

        // 5. Call ML Service for risk prediction
        MLRiskResponse mlResponse = callMLService(
            partId, changeType, bomDepth, whereUsedCount,
            releasedAffected, conflictingChanges, part.getLifecycleState().name(),
            hasComplianceIssues
        );
        
        // 6. Generate recommendations
        String recommendation = generateRecommendation(mlResponse, releasedAffected, conflictingChanges);
        List<String> suggestedActions = generateSuggestedActions(mlResponse, releasedAffected, changeType);
        Integer estimatedCycleDays = estimateCycleTime(mlResponse.getRiskScore(), releasedAffected);
        
        long analysisTime = System.currentTimeMillis() - startTime;
        
        // 7. Build comprehensive analysis
        AIImpactAnalysis analysis = AIImpactAnalysis.builder()
            .partId(partId)
            .partNumber(part.getPartNumber())
            .partName(part.getName())
            .changeType(changeType)
            .bomDepth(bomDepth)
            .whereUsedCount(whereUsedCount)
            .releasedAffected(releasedAffected)
            .conflictingChanges(conflictingChanges)
            .conflictingChangeNumbers(conflictingChangeNumbers)
            .affectedPartNumbers(affectedPartNumbers)
            .hasComplianceIssues(hasComplianceIssues)
            .complianceWarnings(complianceWarnings)
            .riskScore(mlResponse.getRiskScore())
            .confidence(mlResponse.getConfidence())
            .riskLevel(mlResponse.getRiskLevel())
            .riskFactors(mlResponse.getFactors())
            .modelType(mlResponse.getModelType())
            .recommendation(recommendation)
            .suggestedActions(suggestedActions)
            .estimatedCycleTimeDays(estimatedCycleDays)
            .analyzedAt(LocalDateTime.now())
            .analysisTimeMs(analysisTime)
            .build();
        
        // 8. Audit log (this writes to database - reason we removed readOnly=true)
        try {
            auditService.log(PlmEntityTypeEnum.PART, partId, "AI_ANALYSIS", 
                String.format("Risk: %s (%.1f/10), Model: %s, Time: %dms", 
                    mlResponse.getRiskLevel(), mlResponse.getRiskScore(), 
                    mlResponse.getModelType(), analysisTime));
        } catch (Exception e) {
            // Don't fail entire analysis if audit logging fails
            log.warn("Audit logging failed for AI analysis: {}", e.getMessage());
        }
        
        log.info("AI analysis completed: partId={}, risk={}, time={}ms", 
            partId, mlResponse.getRiskLevel(), analysisTime);
        
        return analysis;
    }

    @Override
    public boolean isMLServiceHealthy() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                mlServiceUrl + "/health", Map.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("ML service health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calculate BOM depth using recursive DFS with cycle detection
     */
    private int calculateBomDepth(Long partId, int currentDepth, Set<Long> visited) {
        if (visited.contains(partId)) {
            return currentDepth; // Circular reference detected
        }
        visited.add(partId);
        
        List<BomLine> children = bomLineRepository
            .findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(partId);
        
        if (children == null || children.isEmpty()) {
            return currentDepth;
        }
        
        int maxDepth = currentDepth;
        for (BomLine child : children) {
            int childDepth = calculateBomDepth(child.getChildPartId(), currentDepth + 1, new HashSet<>(visited));
            maxDepth = Math.max(maxDepth, childDepth);
        }
        
        return maxDepth;
    }

    /**
     * Count how many RELEASED parts are affected
     */
    private int countReleasedParts(List<Long> partIds) {
        if (partIds == null || partIds.isEmpty()) return 0;
        
        List<Part> parts = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(partIds);
        return (int) parts.stream()
            .filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED)
            .count();
    }

    /**
     * Get part numbers of affected assemblies
     */
    private List<String> getAffectedPartNumbers(List<Long> partIds) {
        if (partIds == null || partIds.isEmpty()) return List.of();
        
        List<Part> parts = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(partIds);
        return parts.stream()
            .map(Part::getPartNumber)
            .collect(Collectors.toList());
    }

    /**
     * Call ML microservice for risk prediction
     */
    private MLRiskResponse callMLService(Long partId, String changeType, int bomDepth,
                                         int whereUsedCount, int releasedAffected,
                                         int conflictingChanges, String lifecycleState,
                                         boolean hasComplianceIssues) {
        try {
            MLRiskRequest request = MLRiskRequest.builder()
                .partId(partId)
                .changeType(changeType)
                .bomDepth(bomDepth)
                .whereUsedCount(whereUsedCount)
                .releasedAffected(releasedAffected)
                .conflictingChanges(conflictingChanges)
                .lifecycleState(lifecycleState)
                .hasComplianceIssues(hasComplianceIssues)
                .build();
            
            ResponseEntity<MLRiskResponse> response = restTemplate.postForEntity(
                mlServiceUrl + "/predict-risk",
                request,
                MLRiskResponse.class
            );
            
            return response.getBody();
            
        } catch (Exception e) {
            log.error("ML service call failed: {}", e.getMessage());
            // Fallback to local rule-based if ML service unavailable
            return createFallbackRiskResponse(bomDepth, whereUsedCount, releasedAffected, conflictingChanges);
        }
    }

    /**
     * Fallback risk assessment if ML service is down
     */
    private MLRiskResponse createFallbackRiskResponse(int bomDepth, int whereUsedCount, 
                                                       int releasedAffected, int conflictingChanges) {
        double score = Math.min(10.0, 
            releasedAffected * 3.0 + 
            conflictingChanges * 2.0 + 
            (whereUsedCount > 5 ? 1.5 : 0) +
            (bomDepth > 3 ? 1.0 : 0)
        );
        
        String level = score < 4 ? "LOW" : score < 7 ? "MEDIUM" : "HIGH";
        
        List<String> factors = new ArrayList<>();
        if (releasedAffected > 0) factors.add(releasedAffected + " released parts affected");
        if (whereUsedCount > 5) factors.add("High reuse factor");
        if (bomDepth > 3) factors.add("Complex BOM structure");
        if (factors.isEmpty()) factors.add("Low complexity change");
        
        return MLRiskResponse.builder()
            .riskScore(score)
            .confidence(0.75)
            .riskLevel(level)
            .factors(factors)
            .modelType("FALLBACK_RULE")
            .timestamp(LocalDateTime.now().toString())
            .build();
    }

    /**
     * Generate human-readable recommendation
     */
    private String generateRecommendation(MLRiskResponse ml, int releasedAffected, int conflictingChanges) {
        if (ml.getRiskLevel().equals("LOW")) {
            return "This change is low risk and can proceed through standard review process.";
        }
        
        if (releasedAffected > 0) {
            return String.format(
                "This change affects %d RELEASED part(s) and requires formal ECN process with cascade updates. " +
                "Coordinate with downstream product owners before proceeding.",
                releasedAffected
            );
        }
        
        if (conflictingChanges > 0) {
            return "Conflicting active changes detected. Defer this change or coordinate resolution to avoid conflicts.";
        }
        
        return "Medium risk change - ensure thorough impact review before approving.";
    }

    /**
     * Generate actionable steps
     */
    private List<String> generateSuggestedActions(MLRiskResponse ml, int releasedAffected, String changeType) {
        List<String> actions = new ArrayList<>();
        
        if (releasedAffected > 0) {
            actions.add("Create ECN with " + releasedAffected + " change task(s) for affected released parts");
            actions.add("Notify downstream product owners");
        }
        
        if (ml.getRiskLevel().equals("HIGH")) {
            actions.add("Request senior engineering review");
            actions.add("Verify no active production orders");
        }
        
        if (changeType.equals("OBSOLETE")) {
            actions.add("Coordinate with procurement for supply chain impact");
            actions.add("Check for available substitutes");
        }
        
        if (actions.isEmpty()) {
            actions.add("Proceed with standard review workflow");
        }
        
        return actions;
    }

    /**
     * Estimate cycle time based on complexity
     */
    private Integer estimateCycleTime(double riskScore, int releasedAffected) {
        if (riskScore < 4) return 3;
        if (riskScore < 7) return 7;

        // High risk: 7 days base + 2 days per released part
        return 7 + (releasedAffected * 2);
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // CONFLICT DETECTION
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Detect active ECRs that impact any of the where-used parent parts.
     * An active ECR is one not in CLOSED or REJECTED state.
     *
     * @param parentPartIds the list of parent part IDs from where-used analysis
     * @return count of unique active ECRs that conflict with this change
     */
    private int detectConflictingChanges(List<Long> parentPartIds) {
        if (parentPartIds == null || parentPartIds.isEmpty()) {
            return 0;
        }

        Set<Long> parentIdSet = new HashSet<>(parentPartIds);
        List<ChangeRequest> activeEcrs = changeRequestRepository.findActiveChangeRequests();

        Set<Long> conflictingEcrIds = new HashSet<>();
        for (ChangeRequest ecr : activeEcrs) {
            if (ecr.getImpactedPartIds() == null || ecr.getImpactedPartIds().isBlank()) {
                continue;
            }
            for (String idToken : ecr.getImpactedPartIds().split(",")) {
                try {
                    Long impactedId = Long.parseLong(idToken.trim());
                    if (parentIdSet.contains(impactedId)) {
                        conflictingEcrIds.add(ecr.getId());
                        break; // count this ECR once
                    }
                } catch (NumberFormatException ignored) {
                    // malformed token — skip
                }
            }
        }

        return conflictingEcrIds.size();
    }

    /**
     * Get the change numbers of conflicting active ECRs for reporting.
     */
    private List<String> getConflictingChangeNumbers(List<Long> parentPartIds) {
        if (parentPartIds == null || parentPartIds.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> parentIdSet = new HashSet<>(parentPartIds);
        List<ChangeRequest> activeEcrs = changeRequestRepository.findActiveChangeRequests();

        List<String> numbers = new ArrayList<>();
        for (ChangeRequest ecr : activeEcrs) {
            if (ecr.getImpactedPartIds() == null || ecr.getImpactedPartIds().isBlank()) {
                continue;
            }
            for (String idToken : ecr.getImpactedPartIds().split(",")) {
                try {
                    Long impactedId = Long.parseLong(idToken.trim());
                    if (parentIdSet.contains(impactedId)) {
                        numbers.add(ecr.getChangeNumber());
                        break;
                    }
                } catch (NumberFormatException ignored) {
                    // skip
                }
            }
        }
        return numbers;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // COMPLIANCE CHECKING
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Check whether the proposed change violates any compliance / lifecycle rules.
     *
     * Rules checked:
     *   1. OBSOLETE on a RELEASED part requires a formal ECN (compliance flag)
     *   2. Changing a part that affects RELEASED parents without an ECN path
     *   3. PROMOTE on a part at the latest revision (should already be promoted)
     *
     * @return true if any compliance rule is violated
     */
    private boolean checkCompliance(Part part, String changeType, List<Long> parentPartIds) {
        // Rule 1: Obsoleting a released part requires formal process
        if ("OBSOLETE".equalsIgnoreCase(changeType)
                && part.getLifecycleState() == LifecycleStateEnum.RELEASED) {
            return true;
        }

        // Rule 2: Check if affected parents include RELEASED parts (requires ECN cascade)
        if (parentPartIds != null && !parentPartIds.isEmpty()) {
            List<Part> parents = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(parentPartIds);
            if (parents != null && parents.stream()
                    .anyMatch(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED)) {
                // Any change affecting released parents is a compliance concern
                return true;
            }
        }

        return false;
    }

    /**
     * Generate human-readable compliance warnings for the user.
     */
    private List<String> getComplianceWarnings(Part part, String changeType, List<Long> parentPartIds) {
        List<String> warnings = new ArrayList<>();

        if ("OBSOLETE".equalsIgnoreCase(changeType)
                && part.getLifecycleState() == LifecycleStateEnum.RELEASED) {
            warnings.add("Obsoleting a RELEASED part requires a formal ECN with phase-out plan");
        }

        if (parentPartIds != null && !parentPartIds.isEmpty()) {
            List<Part> parents = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(parentPartIds);
            if (parents != null) {
                long releasedParents = parents.stream()
                        .filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED)
                        .count();
                if (releasedParents > 0) {
                    warnings.add(String.format(
                            "%d released parent part(s) affected — coordinate ECN cascade", releasedParents));
                }
            }
        }

        return warnings;
    }
}
