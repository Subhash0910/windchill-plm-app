package com.windchill.change.impact.service;

import com.windchill.change.domain.ChangeRequest;
import com.windchill.change.repository.ChangeRequestRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ChangeSimilarityService {

    private final ChangeRequestRepository changeRequestRepository;

    public ChangeSimilarityService(ChangeRequestRepository changeRequestRepository) {
        this.changeRequestRepository = changeRequestRepository;
    }

    public List<SimilarChange> findSimilar(Long ecrId, int limit) {
        ChangeRequest seed = changeRequestRepository.findById(ecrId).orElse(null);
        if (seed == null) {
            return List.of();
        }

        Map<Long, SimilarChange> ranked = new LinkedHashMap<>();

        // 1) Same context object (strongest heuristic)
        if (seed.getContextType() != null && seed.getContextId() != null) {
            List<ChangeRequest> sameCtx = changeRequestRepository
                    .findTop50ByContextTypeIgnoreCaseAndContextIdAndIdNotOrderByIdDesc(seed.getContextType(), seed.getContextId(), seed.getId());
            for (ChangeRequest c : sameCtx) {
                ranked.putIfAbsent(c.getId(), toSimilar(c, 90, "Same context object"));
            }
        }

        // 2) Similar title terms (lightweight heuristic)
        if (seed.getTitle() != null && seed.getTitle().trim().length() >= 4) {
            String key = pickKeyword(seed.getTitle());
            if (key != null) {
                List<ChangeRequest> titleLike = changeRequestRepository
                        .findTop50ByTitleContainingIgnoreCaseAndIdNotOrderByIdDesc(key, seed.getId());
                for (ChangeRequest c : titleLike) {
                    ranked.putIfAbsent(c.getId(), toSimilar(c, 60, "Title keyword match: " + key));
                }
            }
        }

        List<SimilarChange> out = new ArrayList<>(ranked.values());
        if (out.size() > limit) {
            return out.subList(0, limit);
        }
        return out;
    }

    private SimilarChange toSimilar(ChangeRequest c, int score, String reason) {
        SimilarChange s = new SimilarChange();
        s.setEcrId(c.getId());
        s.setNumber(c.getNumber());
        s.setTitle(c.getTitle());
        s.setStatus(c.getStatus() == null ? null : c.getStatus().name());
        s.setScore(score);
        s.setReason(reason);
        return s;
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

    public static class SimilarChange {
        private Long ecrId;
        private String number;
        private String title;
        private String status;
        private Integer score;
        private String reason;

        public Long getEcrId() {
            return ecrId;
        }

        public void setEcrId(Long ecrId) {
            this.ecrId = ecrId;
        }

        public String getNumber() {
            return number;
        }

        public void setNumber(String number) {
            this.number = number;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Integer getScore() {
            return score;
        }

        public void setScore(Integer score) {
            this.score = score;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
