package com.windchill.ai.service;

import com.windchill.ai.dto.GraphImpactResult;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service for graph-based structural analysis of BOMs and part relationships.
 * Performs depth-first traversal to find all affected parts.
 */
@Slf4j
@Service
public class GraphAnalysisService {

    @Autowired
    private PartRepository partRepository;

    @Autowired
    private BomLineRepository bomLineRepository;

    /**
     * Analyze the impact of changing a part by traversing its BOM relationships.
     */
    public GraphImpactResult analyzePartChange(Long partId, String changeType) {
        log.info("Starting graph analysis for partId={}, changeType={}", partId, changeType);

        try {
            // Fetch the target part
            Part targetPart = partRepository.findById(partId)
                    .orElseThrow(() -> new RuntimeException("Part not found: " + partId));

            // Find all parent assemblies (where-used analysis)
            Set<Long> affectedPartIds = new HashSet<>();
            int maxDepth = findAffectedParents(partId, affectedPartIds, 0);

            // Get details of affected parts
            List<Part> affectedParts = partRepository.findAllById(affectedPartIds);
            
            // Count released parts
            long releasedCount = affectedParts.stream()
                    .filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED)
                    .count();

            // Analyze BOM structure complexity
            boolean complexStructure = affectedPartIds.size() > 10 || maxDepth > 5;

            // Build result using builder pattern
            GraphImpactResult result = GraphImpactResult.builder()
                    .totalAffectedCount(affectedPartIds.size())
                    .releasedAffectedCount((int) releasedCount)
                    .bomDepth(maxDepth)
                    .hasComplexStructure(complexStructure)
                    .conflictingChangesCount(0)
                    .conflictingChangeNumbers(Collections.emptyList())
                    .hasComplianceIssues(false)
                    .currentLifecycleState(targetPart.getLifecycleState() != null ? 
                            targetPart.getLifecycleState().name() : "UNKNOWN")
                    .currentVersion(targetPart.getRevision() + "." + targetPart.getIteration())
                    .structuralComplexity(calculateComplexity(affectedPartIds.size(), maxDepth))
                    .build();

            log.info("Graph analysis completed: {} affected parts, {} released, depth {}",
                    affectedPartIds.size(), releasedCount, maxDepth);

            return result;

        } catch (Exception e) {
            log.error("Graph analysis failed for partId={}", partId, e);
            throw new RuntimeException("Graph analysis failed: " + e.getMessage(), e);
        }
    }

    /**
     * Calculate structural complexity score (0-10)
     */
    private double calculateComplexity(int affectedCount, int depth) {
        double score = 0;
        
        // Factor 1: Number of affected parts
        if (affectedCount > 50) score += 5;
        else if (affectedCount > 20) score += 3;
        else if (affectedCount > 10) score += 2;
        else if (affectedCount > 5) score += 1;
        
        // Factor 2: BOM depth
        if (depth > 7) score += 5;
        else if (depth > 5) score += 3;
        else if (depth > 3) score += 2;
        else if (depth > 1) score += 1;
        
        return Math.min(10, score);
    }

    /**
     * Recursively find all parent assemblies that use this part.
     * Performs depth-first traversal up the BOM tree.
     */
    private int findAffectedParents(Long childPartId, Set<Long> affectedParts, int currentDepth) {
        // Prevent infinite loops
        if (currentDepth > 20) {
            log.warn("BOM traversal depth limit reached at {}", currentDepth);
            return currentDepth;
        }

        // Find all parent assemblies
        List<Long> parentIds = bomLineRepository.findDistinctParentPartIdsByChildPartId(childPartId);

        if (parentIds.isEmpty()) {
            return currentDepth;
        }

        int maxDepth = currentDepth;

        for (Long parentId : parentIds) {
            // Avoid circular references
            if (!affectedParts.contains(parentId)) {
                affectedParts.add(parentId);
                
                // Recursively traverse up
                int depth = findAffectedParents(parentId, affectedParts, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        }

        return maxDepth;
    }

    /**
     * Find all child parts in the BOM (explosion).
     * Useful for analyzing impact of material changes.
     */
    public Set<Long> explodeBOM(Long parentPartId, int maxDepth) {
        Set<Long> allChildren = new HashSet<>();
        explodeBOMRecursive(parentPartId, allChildren, 0, maxDepth);
        return allChildren;
    }

    private void explodeBOMRecursive(Long parentPartId, Set<Long> children, int depth, int maxDepth) {
        if (depth >= maxDepth) {
            return;
        }

        List<BomLine> bomLines = bomLineRepository
                .findByParentPartIdAndIsDeletedFalseOrderBySortOrderAscIdAsc(parentPartId);

        for (BomLine line : bomLines) {
            Long childId = line.getChildPartId();
            if (!children.contains(childId)) {
                children.add(childId);
                explodeBOMRecursive(childId, children, depth + 1, maxDepth);
            }
        }
    }
}