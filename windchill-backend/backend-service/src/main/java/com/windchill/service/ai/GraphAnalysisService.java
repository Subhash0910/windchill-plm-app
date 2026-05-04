package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.dto.GraphImpactResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GraphAnalysisService {

    private final PartRepository partRepository;
    private final BomLineRepository bomLineRepository;

    @Transactional(readOnly = true)
    public GraphImpactResult analyzePartChange(Long partId, String changeType) {
        log.info("Starting graph analysis for partId={}, changeType={}", partId, changeType);
        try {
            Part targetPart = partRepository.findById(partId)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found"));

            Set<Long> affectedPartIds = new HashSet<>();
            int maxDepth = findAffectedParents(partId, affectedPartIds, 0);

            List<Part> affectedParts = partRepository.findAllById(affectedPartIds);
            long releasedCount = affectedParts.stream()
                .filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED)
                .count();

            boolean complexStructure = affectedPartIds.size() > 10 || maxDepth > 5;

            GraphImpactResult result = GraphImpactResult.builder()
                .totalAffectedCount(affectedPartIds.size())
                .releasedAffectedCount((int) releasedCount)
                .bomDepth(maxDepth)
                .hasComplexStructure(complexStructure)
                .conflictingChangesCount(0)
                .conflictingChangeNumbers(Collections.emptyList())
                .hasComplianceIssues(false)
                .currentLifecycleState(targetPart.getLifecycleState() != null
                    ? targetPart.getLifecycleState().name() : "UNKNOWN")
                .currentVersion(targetPart.getRevision() + "." + targetPart.getIteration())
                .structuralComplexity(calculateComplexity(affectedPartIds.size(), maxDepth))
                .build();

            log.info("Graph analysis completed: {} affected parts, {} released, depth {}",
                affectedPartIds.size(), releasedCount, maxDepth);
            return result;

        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Graph analysis failed for partId={}", partId, e);
            throw new RuntimeException("Graph analysis could not be completed", e);
        }
    }

    private double calculateComplexity(int affectedCount, int depth) {
        double score = 0;
        if (affectedCount > 50)      score += 5;
        else if (affectedCount > 20) score += 3;
        else if (affectedCount > 10) score += 2;
        else if (affectedCount > 5)  score += 1;
        if (depth > 7)      score += 5;
        else if (depth > 5) score += 3;
        else if (depth > 3) score += 2;
        else if (depth > 1) score += 1;
        return Math.min(10, score);
    }

    private int findAffectedParents(Long childPartId, Set<Long> affectedParts, int currentDepth) {
        if (currentDepth > 20) {
            log.warn("BOM traversal depth limit reached at {}", currentDepth);
            return currentDepth;
        }
        List<Long> parentIds = bomLineRepository.findDistinctParentPartIdsByChildPartId(childPartId);
        if (parentIds.isEmpty()) return currentDepth;
        int maxDepth = currentDepth;
        for (Long parentId : parentIds) {
            if (!affectedParts.contains(parentId)) {
                affectedParts.add(parentId);
                int depth = findAffectedParents(parentId, affectedParts, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        }
        return maxDepth;
    }

    @Transactional(readOnly = true)
    public Set<Long> explodeBOM(Long parentPartId, int maxDepth) {
        Set<Long> allChildren = new HashSet<>();
        explodeBOMRecursive(parentPartId, allChildren, 0, maxDepth);
        return allChildren;
    }

    private void explodeBOMRecursive(Long parentPartId, Set<Long> children, int depth, int maxDepth) {
        if (depth >= maxDepth) return;
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
