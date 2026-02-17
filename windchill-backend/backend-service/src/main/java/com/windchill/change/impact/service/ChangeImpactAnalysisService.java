package com.windchill.change.impact.service;

import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.impact.domain.ImpactItem;
import com.windchill.change.impact.domain.ImpactReport;
import com.windchill.change.impact.domain.ImpactRiskLevel;
import com.windchill.change.impact.repository.ImpactItemRepository;
import com.windchill.change.impact.repository.ImpactReportRepository;
import com.windchill.change.repository.ChangeRequestRepository;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import com.windchill.repository.BomLineRepository;
import com.windchill.repository.PartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class ChangeImpactAnalysisService {

    private static final int DEFAULT_MAX_DEPTH = 10;
    private static final int DEFAULT_MAX_NODES = 500;

    private final ChangeRequestRepository changeRequestRepository;
    private final BomLineRepository bomLineRepository;
    private final PartRepository partRepository;
    private final ImpactReportRepository impactReportRepository;
    private final ImpactItemRepository impactItemRepository;

    public ChangeImpactAnalysisService(ChangeRequestRepository changeRequestRepository,
                                      BomLineRepository bomLineRepository,
                                      PartRepository partRepository,
                                      ImpactReportRepository impactReportRepository,
                                      ImpactItemRepository impactItemRepository) {
        this.changeRequestRepository = changeRequestRepository;
        this.bomLineRepository = bomLineRepository;
        this.partRepository = partRepository;
        this.impactReportRepository = impactReportRepository;
        this.impactItemRepository = impactItemRepository;
    }

    @Transactional
    public ImpactReport analyzeForEcr(Long ecrId) {
        ChangeRequest ecr = changeRequestRepository.findById(ecrId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "ECR not found"));

        String ctxType = safeUpper(ecr.getContextType());
        String ctxId = ecr.getContextId();

        if (!"PART".equals(ctxType) || ctxId == null || ctxId.isBlank()) {
            ImpactReport empty = new ImpactReport();
            empty.setEcrId(ecrId);
            empty.setRootObjectType(ctxType == null ? "UNKNOWN" : ctxType);
            empty.setRootObjectId(ctxId == null ? "" : ctxId);
            empty.setScore(0);
            empty.setRiskLevel(ImpactRiskLevel.LOW);
            empty.setFactorsJson("{\"note\":\"No analyzable context: expected contextType=PART and numeric contextId\"}");
            return impactReportRepository.save(empty);
        }

        Long partId = parseLongOrThrow(ctxId);

        ImpactComputationResult result = computeWhereUsed(partId, DEFAULT_MAX_DEPTH, DEFAULT_MAX_NODES);

        Part root = partRepository.findById(partId).orElse(null);
        String rootState = root == null || root.getLifecycleState() == null ? null : root.getLifecycleState().name();

        List<Long> impactedParentIds = new ArrayList<>(result.parentDepthMap.keySet());
        int releasedParentsCount = countReleased(impactedParentIds);

        int score = computeScore(result.impactedParentsCount, releasedParentsCount, result.maxDepth, result.maxNodesHit, rootState);
        ImpactRiskLevel risk = toRisk(score);

        ImpactReport report = new ImpactReport();
        report.setEcrId(ecrId);
        report.setRootObjectType("PART");
        report.setRootObjectId(String.valueOf(partId));
        report.setScore(score);
        report.setRiskLevel(risk);
        report.setFactorsJson(buildFactorsJson(result, releasedParentsCount, rootState));

        ImpactReport savedReport = impactReportRepository.save(report);

        List<ImpactItem> items = new ArrayList<>();
        items.add(buildItem(savedReport.getId(), "PART", String.valueOf(partId), "CHANGED", 0, null));

        for (Map.Entry<Long, Integer> e : result.parentDepthMap.entrySet()) {
            items.add(buildItem(savedReport.getId(), "PART", String.valueOf(e.getKey()), "WHERE_USED_PARENT", e.getValue(), null));
        }

        impactItemRepository.saveAll(items);

        return savedReport;
    }

    @Transactional(readOnly = true)
    public ImpactReport getLatestReport(Long ecrId) {
        return impactReportRepository.findTopByEcrIdOrderByCreatedAtDesc(ecrId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "No impact report for ECR"));
    }

    @Transactional(readOnly = true)
    public ImpactReport getLatestReportOrNull(Long ecrId) {
        return impactReportRepository.findTopByEcrIdOrderByCreatedAtDesc(ecrId).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ImpactItem> getItems(Long reportId) {
        return impactItemRepository.findByReportIdOrderByDepthAscIdAsc(reportId);
    }

    private int countReleased(List<Long> partIds) {
        if (partIds == null || partIds.isEmpty()) return 0;
        List<Part> parts = partRepository.findByIdInAndIsDeletedFalseOrderByPartNumberAsc(partIds);
        int count = 0;
        for (Part p : parts) {
            if (p.getLifecycleState() == LifecycleStateEnum.RELEASED) {
                count++;
            }
        }
        return count;
    }

    private ImpactItem buildItem(Long reportId, String objectType, String objectId, String relation, int depth, String pathHint) {
        ImpactItem it = new ImpactItem();
        it.setReportId(reportId);
        it.setObjectType(objectType);
        it.setObjectId(objectId);
        it.setRelation(relation);
        it.setDepth(depth);
        it.setPathHint(pathHint);
        return it;
    }

    private ImpactComputationResult computeWhereUsed(Long partId, int maxDepth, int maxNodes) {
        ArrayDeque<Node> q = new ArrayDeque<>();
        Set<Long> visited = new HashSet<>();
        Map<Long, Integer> depthByParent = new HashMap<>();

        q.add(new Node(partId, 0));
        visited.add(partId);

        int maxDepthSeen = 0;
        boolean maxNodesHit = false;

        while (!q.isEmpty()) {
            Node n = q.poll();
            if (n.depth >= maxDepth) {
                continue;
            }

            List<Long> parents = bomLineRepository.findDistinctParentPartIdsByChildPartId(n.partId);
            for (Long p : parents) {
                if (p == null) {
                    continue;
                }
                int nextDepth = n.depth + 1;
                maxDepthSeen = Math.max(maxDepthSeen, nextDepth);

                depthByParent.merge(p, nextDepth, Math::min);

                if (visited.add(p)) {
                    q.add(new Node(p, nextDepth));
                    if (visited.size() >= maxNodes) {
                        maxNodesHit = true;
                        q.clear();
                        break;
                    }
                }
            }
        }

        ImpactComputationResult r = new ImpactComputationResult();
        r.impactedParentsCount = depthByParent.size();
        r.maxDepth = maxDepthSeen;
        r.maxNodesHit = maxNodesHit;
        r.parentDepthMap = depthByParent;
        return r;
    }

    private int computeScore(int impactedParentsCount, int releasedParentsCount, int maxDepth, boolean maxNodesHit, String rootState) {
        int score = 0;

        // Structural impact
        score += impactedParentsCount * 4;
        score += maxDepth * 8;

        // Released parents are the real risk multiplier
        score += releasedParentsCount * 15;

        // Changing a released part itself is risky
        if ("RELEASED".equalsIgnoreCase(rootState)) {
            score += 20;
        }

        // Safety guardrail: if traversal capped, add a small penalty
        if (maxNodesHit) {
            score += 10;
        }

        return Math.min(100, Math.max(0, score));
    }

    private ImpactRiskLevel toRisk(int score) {
        if (score >= 75) return ImpactRiskLevel.HIGH;
        if (score >= 35) return ImpactRiskLevel.MEDIUM;
        return ImpactRiskLevel.LOW;
    }

    private String buildFactorsJson(ImpactComputationResult r, int releasedParentsCount, String rootState) {
        String rootStateJson = rootState == null ? "null" : "\"" + rootState + "\"";
        return "{" +
                "\"impactedParentsCount\":" + r.impactedParentsCount + "," +
                "\"releasedParentsCount\":" + releasedParentsCount + "," +
                "\"maxDepth\":" + r.maxDepth + "," +
                "\"maxNodesHit\":" + r.maxNodesHit + "," +
                "\"rootLifecycleState\":" + rootStateJson +
                "}";
    }

    private Long parseLongOrThrow(String raw) {
        try {
            return Long.parseLong(raw.trim());
        } catch (Exception ex) {
            throw new ResponseStatusException(BAD_REQUEST, "contextId must be a numeric partId");
        }
    }

    private String safeUpper(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return null;
        return t.toUpperCase();
    }

    private static class Node {
        final Long partId;
        final int depth;

        Node(Long partId, int depth) {
            this.partId = partId;
            this.depth = depth;
        }
    }

    private static class ImpactComputationResult {
        int impactedParentsCount;
        int maxDepth;
        boolean maxNodesHit;
        Map<Long, Integer> parentDepthMap;
    }
}
