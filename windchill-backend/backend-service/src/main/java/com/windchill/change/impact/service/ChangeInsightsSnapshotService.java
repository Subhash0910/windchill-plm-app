package com.windchill.change.impact.service;

import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.impact.domain.ImpactItem;
import com.windchill.change.impact.domain.ImpactReport;
import com.windchill.change.impact.domain.ImpactSimilarChange;
import com.windchill.change.impact.repository.ImpactItemRepository;
import com.windchill.change.impact.repository.ImpactReportRepository;
import com.windchill.change.impact.repository.ImpactSimilarChangeRepository;
import com.windchill.change.repository.ChangeRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ChangeInsightsSnapshotService {

    private final ImpactReportRepository impactReportRepository;
    private final ImpactItemRepository impactItemRepository;
    private final ImpactSimilarChangeRepository impactSimilarChangeRepository;
    private final ChangeRequestRepository changeRequestRepository;

    public ChangeInsightsSnapshotService(ImpactReportRepository impactReportRepository,
                                        ImpactItemRepository impactItemRepository,
                                        ImpactSimilarChangeRepository impactSimilarChangeRepository,
                                        ChangeRequestRepository changeRequestRepository) {
        this.impactReportRepository = impactReportRepository;
        this.impactItemRepository = impactItemRepository;
        this.impactSimilarChangeRepository = impactSimilarChangeRepository;
        this.changeRequestRepository = changeRequestRepository;
    }

    @Transactional
    public List<ImpactSimilarChange> ensureSimilaritiesForReport(Long reportId, Long seedEcrId, int limit) {
        if (impactSimilarChangeRepository.existsByReportId(reportId)) {
            return impactSimilarChangeRepository.findByReportIdOrderByScoreDescIdAsc(reportId);
        }

        ImpactReport seedReport = impactReportRepository.findById(reportId).orElse(null);
        if (seedReport == null) {
            return List.of();
        }

        Set<String> seedSet = impactedParentPartSet(reportId);
        if (seedSet.isEmpty()) {
            return List.of();
        }

        ChangeRequest seed = changeRequestRepository.findById(seedEcrId).orElse(null);
        List<ChangeRequest> candidates = changeRequestRepository.findTop200ByIdNotOrderByIdDesc(seedEcrId);

        List<ScoredCandidate> scored = new ArrayList<>();
        for (ChangeRequest c : candidates) {
            ImpactReport candReport = impactReportRepository.findTopByEcrIdOrderByCreatedAtDesc(c.getId()).orElse(null);
            if (candReport == null) {
                continue;
            }

            Set<String> candSet = impactedParentPartSet(candReport.getId());
            if (candSet.isEmpty()) {
                continue;
            }

            double j = jaccard(seedSet, candSet);
            int score = (int) Math.round(100.0 * j);
            String reason = "Impact overlap";

            // boost if same context object
            if (seed != null && seed.getContextType() != null && seed.getContextId() != null
                    && c.getContextType() != null && c.getContextId() != null
                    && seed.getContextType().equalsIgnoreCase(c.getContextType())
                    && seed.getContextId().equalsIgnoreCase(c.getContextId())) {
                score = Math.min(100, score + 15);
                reason = "Same context + impact overlap";
            }

            // tiny boost if keyword appears
            if (seed != null && seed.getTitle() != null && c.getTitle() != null) {
                String kw = pickKeyword(seed.getTitle());
                if (kw != null && c.getTitle().toLowerCase(Locale.ROOT).contains(kw)) {
                    score = Math.min(100, score + 5);
                    reason = reason + " (+title keyword)";
                }
            }

            if (score <= 0) {
                continue;
            }

            scored.add(new ScoredCandidate(c.getId(), score, reason));
        }

        scored.sort(Comparator.comparingInt(ScoredCandidate::score).reversed().thenComparingLong(ScoredCandidate::ecrId));

        List<ImpactSimilarChange> out = new ArrayList<>();
        int take = Math.min(limit, scored.size());
        for (int i = 0; i < take; i++) {
            ScoredCandidate sc = scored.get(i);
            ImpactSimilarChange s = new ImpactSimilarChange();
            s.setReportId(reportId);
            s.setSimilarEcrId(sc.ecrId());
            s.setScore(sc.score());
            s.setReason(sc.reason());
            out.add(s);
        }

        return impactSimilarChangeRepository.saveAll(out);
    }

    @Transactional(readOnly = true)
    public List<ImpactSimilarChange> getSimilarities(Long reportId) {
        return impactSimilarChangeRepository.findByReportIdOrderByScoreDescIdAsc(reportId);
    }

    private Set<String> impactedParentPartSet(Long reportId) {
        List<ImpactItem> items = impactItemRepository.findByReportIdOrderByDepthAscIdAsc(reportId);
        Set<String> s = new HashSet<>();
        for (ImpactItem it : items) {
            if (it.getDepth() != null && it.getDepth() > 0 && "PART".equalsIgnoreCase(it.getObjectType())) {
                s.add(it.getObjectId());
            }
        }
        return s;
    }

    private double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() && b.isEmpty()) return 1.0;
        if (a.isEmpty() || b.isEmpty()) return 0.0;
        int intersection = 0;
        // iterate smaller
        Set<String> small = a.size() <= b.size() ? a : b;
        Set<String> large = a.size() <= b.size() ? b : a;
        for (String x : small) {
            if (large.contains(x)) intersection++;
        }
        int union = a.size() + b.size() - intersection;
        if (union == 0) return 0.0;
        return (double) intersection / (double) union;
    }

    private String pickKeyword(String title) {
        String t = title.trim().toLowerCase(Locale.ROOT);
        String[] tokens = t.split("\\s+");
        for (String tok : tokens) {
            String clean = tok.replaceAll("[^a-z0-9]", "");
            if (clean.length() >= 4) {
                return clean;
            }
        }
        return null;
    }

    private record ScoredCandidate(Long ecrId, Integer score, String reason) {
    }
}
