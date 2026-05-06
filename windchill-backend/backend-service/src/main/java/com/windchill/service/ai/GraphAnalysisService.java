package com.windchill.service.ai;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.BomLine;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.ChangeRequestRepository;
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
    private final ChangeRequestRepository changeRequestRepository;

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

            // Conflict detection: find active ECRs on affected parts
            int conflictingCount = detectConflictingChanges(new ArrayList<>(affectedPartIds));
            List<String> conflictingNumbers = getConflictingChangeNumbers(new ArrayList<>(affectedPartIds));

            // Compliance check: lifecycle + released-parent rules
            boolean hasComplianceIssues = checkCompliance(targetPart, changeType,
                    new ArrayList<>(affectedPartIds));
            List<String> complianceWarnings = getComplianceWarnings(targetPart, changeType,
                    new ArrayList<>(affectedPartIds));

            GraphImpactResult result = GraphImpactResult.builder()
                .totalAffectedCount(affectedPartIds.size())
                .releasedAffectedCount((int) releasedCount)
                .bomDepth(maxDepth)
                .hasComplexStructure(complexStructure)
                .conflictingChangesCount(conflictingCount)
                .conflictingChangeNumbers(conflictingNumbers)
                .hasComplianceIssues(hasComplianceIssues)
                .complianceWarnings(complianceWarnings)
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

    // ══════════════════════════════════════════════════════════════════════════════
    // CONFLICT DETECTION
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Count active ECRs whose impactedPartIds overlap with the given part IDs.
     */
    private int detectConflictingChanges(List<Long> partIds) {
        if (partIds == null || partIds.isEmpty()) return 0;

        Set<Long> idSet = new HashSet<>(partIds);
        List<ChangeRequest> activeEcrs = changeRequestRepository.findActiveChangeRequests();

        Set<Long> conflictingIds = new HashSet<>();
        for (ChangeRequest ecr : activeEcrs) {
            if (ecr.getImpactedPartIds() == null || ecr.getImpactedPartIds().isBlank()) continue;
            for (String token : ecr.getImpactedPartIds().split(",")) {
                try {
                    if (idSet.contains(Long.parseLong(token.trim()))) {
                        conflictingIds.add(ecr.getId());
                        break;
                    }
                } catch (NumberFormatException ignored) { /* skip */ }
            }
        }
        return conflictingIds.size();
    }

    /**
     * Collect change numbers of conflicting active ECRs.
     */
    private List<String> getConflictingChangeNumbers(List<Long> partIds) {
        if (partIds == null || partIds.isEmpty()) return Collections.emptyList();

        Set<Long> idSet = new HashSet<>(partIds);
        List<ChangeRequest> activeEcrs = changeRequestRepository.findActiveChangeRequests();

        List<String> numbers = new ArrayList<>();
        for (ChangeRequest ecr : activeEcrs) {
            if (ecr.getImpactedPartIds() == null || ecr.getImpactedPartIds().isBlank()) continue;
            for (String token : ecr.getImpactedPartIds().split(",")) {
                try {
                    if (idSet.contains(Long.parseLong(token.trim()))) {
                        numbers.add(ecr.getChangeNumber());
                        break;
                    }
                } catch (NumberFormatException ignored) { /* skip */ }
            }
        }
        return numbers;
    }

    // ══════════════════════════════════════════════════════════════════════════════
    // COMPLIANCE CHECKING
    // ══════════════════════════════════════════════════════════════════════════════

    /**
     * Check lifecycle compliance rules against the proposed change.
     */
    private boolean checkCompliance(Part part, String changeType, List<Long> affectedPartIds) {
        if ("OBSOLETE".equalsIgnoreCase(changeType)
                && part.getLifecycleState() == LifecycleStateEnum.RELEASED) {
            return true;
        }
        if (affectedPartIds != null && !affectedPartIds.isEmpty()) {
            List<Part> affected = partRepository.findAllById(affectedPartIds);
            if (affected != null && affected.stream()
                    .anyMatch(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Generate human-readable compliance warnings.
     */
    private List<String> getComplianceWarnings(Part part, String changeType, List<Long> affectedPartIds) {
        List<String> warnings = new ArrayList<>();
        if ("OBSOLETE".equalsIgnoreCase(changeType)
                && part.getLifecycleState() == LifecycleStateEnum.RELEASED) {
            warnings.add("Obsoleting a RELEASED part requires a formal ECN with phase-out plan");
        }
        if (affectedPartIds != null && !affectedPartIds.isEmpty()) {
            List<Part> affected = partRepository.findAllById(affectedPartIds);
            if (affected != null) {
                long released = affected.stream()
                        .filter(p -> p.getLifecycleState() == LifecycleStateEnum.RELEASED).count();
                if (released > 0) {
                    warnings.add(String.format(
                            "%d released part(s) affected — coordinate ECN cascade", released));
                }
            }
        }
        return warnings;
    }
}
