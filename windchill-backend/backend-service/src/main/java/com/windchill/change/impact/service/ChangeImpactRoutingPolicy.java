package com.windchill.change.impact.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class ChangeImpactRoutingPolicy {

    private final List<String> seniorReviewers;

    public ChangeImpactRoutingPolicy(@Value("${change-impact.senior-reviewers:}") String seniorReviewersCsv) {
        this.seniorReviewers = parseCsv(seniorReviewersCsv);
    }

    public List<String> getSeniorReviewers() {
        return Collections.unmodifiableList(seniorReviewers);
    }

    private List<String> parseCsv(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String[] parts = raw.split(",");
        List<String> out = new ArrayList<>();
        for (String p : parts) {
            if (p == null) continue;
            String t = p.trim();
            if (!t.isEmpty()) out.add(t);
        }
        return out;
    }
}
