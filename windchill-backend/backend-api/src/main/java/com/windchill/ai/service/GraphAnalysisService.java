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

            GraphImpactResult result = new GraphImpactResult();
            result.setTargetPartId(partId);
            result.setTargetPartNumber(targetPart.getPartNumber());
            result.setChangeType(changeType);

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

            // Build result
            result.setAffectedPartIds(new ArrayList<>(affectedPartIds));
            result.setTotalAffectedCount(affectedPartIds.size());
            result.setReleasedAffectedCount((int) releasedCount);
            result.setBomDepth(maxDepth);
            result.setHasComplexStructure(complexStructure);
            result.setConflictingChangesCount(0); // TODO: Check active ECRs/ECNs
            result.setConflictingChangeNumbers(Collections.emptyList());
            result.setHasComplianceIssues(false); // TODO: Check compliance rules

            log.info("Graph analysis completed: {} affected parts, {} released, depth {}",
                    affectedPartIds.size(), releasedCount, maxDepth);

            return result;

        } catch (Exception e) {
            log.error("Graph analysis failed for partId={}", partId, e);
            throw new RuntimeException("Graph analysis failed: " + e.getMessage(), e);
        }
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