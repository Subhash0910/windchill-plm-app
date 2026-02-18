package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AIImpactServiceImpl implements IAIImpactService {

    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;
    private final IAuditService auditService;
    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://ml-service:5000}")
    private String mlServiceUrl;

    @Override
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
        
        // 4. Detect conflicting changes (future enhancement - placeholder for now)
        int conflictingChanges = 0; // TODO: Check for active ECRs on affected parts
        
        // 5. Call ML Service for risk prediction
        MLRiskResponse mlResponse = callMLService(
            partId, changeType, bomDepth, whereUsedCount, 
            releasedAffected, conflictingChanges, part.getLifecycleState().name()
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
            .affectedPartNumbers(affectedPartNumbers)
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
        
        // 8. Audit log
        auditService.log(PlmEntityTypeEnum.PART, partId, "AI_ANALYSIS", 
            String.format("Risk: %s (%.1f/10), Model: %s, Time: %dms", 
                mlResponse.getRiskLevel(), mlResponse.getRiskScore(), 
                mlResponse.getModelType(), analysisTime));
        
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
                                         int conflictingChanges, String lifecycleState) {
        try {
            MLRiskRequest request = MLRiskRequest.builder()
                .partId(partId)
                .changeType(changeType)
                .bomDepth(bomDepth)
                .whereUsedCount(whereUsedCount)
                .releasedAffected(releasedAffected)
                .conflictingChanges(conflictingChanges)
                .lifecycleState(lifecycleState)
                .hasComplianceIssues(false) // TODO: Implement compliance checker
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
}
