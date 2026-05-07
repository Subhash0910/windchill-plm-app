package com.windchill.api.controller;

import com.windchill.api.document.WTDocumentRepository;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.ChangeOrder;
import com.windchill.repository.ChangeOrderRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.PartRepository;
import com.windchill.service.ai.MLServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Slf4j
@RestController
@RequestMapping("/api/v1/plm/search")
@RequiredArgsConstructor
public class NlSearchController {

    private final PartRepository          partRepo;
    private final WTDocumentRepository    docRepo;
    private final ChangeRequestRepository ecrRepo;
    private final ChangeOrderRepository   ecoRepo;
    private final MLServiceClient         mlClient;
    private final RestTemplate            restTemplate;

    @Value("${ml.service.url:http://ml-service:5000}")
    private String configuredMlServiceUrl;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> search(@RequestParam String q) {
        if (q == null || q.isBlank()) {
            return ok(List.of());
        }

        NlIntent intent = parseIntent(q.trim());
        log.debug("NL search '{}' → intent: types={}, state={}, days={}, kw={}",
            q, intent.entityTypes, intent.lifecycleState, intent.modifiedAfterDays, intent.keywords);

        List<SearchResult> results = new ArrayList<>();
        boolean searchAll = intent.entityTypes.isEmpty();

        if (searchAll || intent.entityTypes.contains("PART")) {
            searchParts(intent, results);
        }
        if (searchAll || intent.entityTypes.contains("DOCUMENT")) {
            searchDocs(intent, results);
        }
        if (searchAll || intent.entityTypes.contains("ECR")) {
            searchEcrs(intent, results);
        }
        if (searchAll || intent.entityTypes.contains("ECO")) {
            searchEcos(intent, results);
        }

        results.sort(Comparator.comparingDouble(SearchResult::score).reversed());
        List<SearchResult> top = results.stream().limit(20).collect(Collectors.toList());

        return ok(Map.of("results", top, "intent", intent, "query", q));
    }

    // ── search helpers ────────────────────────────────────────────────────

    private void searchParts(NlIntent intent, List<SearchResult> out) {
        try {
            var cutoff = intent.modifiedAfterDays != null
                ? LocalDateTime.now().minusDays(intent.modifiedAfterDays) : null;

            partRepo.findByIsLatestTrueAndIsDeletedFalseOrderByPartNumberAsc().stream()
                .filter(p -> matchState(p.getLifecycleState() == null ? null : p.getLifecycleState().name(), intent.lifecycleState))
                .filter(p -> cutoff == null || (p.getUpdatedAt() != null && p.getUpdatedAt().isAfter(cutoff)))
                .filter(p -> matchKeywords(p.getPartNumber() + " " + p.getName(), intent.keywords))
                .map(p -> new SearchResult("PART", p.getId(),
                    p.getPartNumber(),
                    p.getName(),
                    p.getLifecycleState() == null ? null : p.getLifecycleState().name(),
                    "/plm/parts/" + p.getId(),
                    keywordScore(p.getPartNumber() + " " + p.getName(), intent.keywords)))
                .forEach(out::add);
        } catch (Exception e) {
            log.warn("Part search error: {}", e.getMessage());
        }
    }

    private void searchDocs(NlIntent intent, List<SearchResult> out) {
        try {
            var cutoff = intent.modifiedAfterDays != null
                ? LocalDateTime.now().minusDays(intent.modifiedAfterDays) : null;

            docRepo.findAll().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsLatest()) && !Boolean.TRUE.equals(d.getIsDeleted()))
                .filter(d -> matchState(d.getLifecycleState(), intent.lifecycleState))
                .filter(d -> cutoff == null || (d.getUpdatedAt() != null && d.getUpdatedAt().isAfter(cutoff)))
                .filter(d -> matchKeywords(d.getDocNumber() + " " + d.getName(), intent.keywords))
                .map(d -> new SearchResult("DOCUMENT", d.getId(),
                    d.getDocNumber(),
                    d.getName(),
                    d.getLifecycleState(),
                    "/plm/documents/" + d.getId(),
                    keywordScore(d.getDocNumber() + " " + d.getName(), intent.keywords)))
                .forEach(out::add);
        } catch (Exception e) {
            log.warn("Doc search error: {}", e.getMessage());
        }
    }

    private void searchEcrs(NlIntent intent, List<SearchResult> out) {
        try {
            var cutoff = intent.modifiedAfterDays != null
                ? LocalDateTime.now().minusDays(intent.modifiedAfterDays) : null;

            ecrRepo.findAll().stream()
                .filter(e -> matchState(e.getStatus() == null ? null : e.getStatus().name(), intent.lifecycleState))
                .filter(e -> cutoff == null || (e.getUpdatedAt() != null && e.getUpdatedAt().isAfter(cutoff)))
                .filter(e -> matchKeywords(e.getChangeNumber() + " " + e.getTitle(), intent.keywords))
                .map(e -> new SearchResult("ECR", e.getId(),
                    e.getChangeNumber(),
                    e.getTitle(),
                    e.getStatus() == null ? null : e.getStatus().name(),
                    "/plm/changes/ecr/" + e.getId(),
                    keywordScore(e.getChangeNumber() + " " + e.getTitle(), intent.keywords)))
                .forEach(out::add);
        } catch (Exception e) {
            log.warn("ECR search error: {}", e.getMessage());
        }
    }

    private void searchEcos(NlIntent intent, List<SearchResult> out) {
        try {
            var cutoff = intent.modifiedAfterDays != null
                ? LocalDateTime.now().minusDays(intent.modifiedAfterDays) : null;

            ecoRepo.findAll().stream()
                .filter(e -> !Boolean.TRUE.equals(e.getIsDeleted()))
                .filter(e -> intent.lifecycleState == null ||
                    (e.getState() != null && e.getState().name().equalsIgnoreCase(intent.lifecycleState)))
                .filter(e -> cutoff == null || (e.getUpdatedAt() != null && e.getUpdatedAt().isAfter(cutoff)))
                .filter(e -> matchKeywords(e.getEcoNumber() + " " + e.getTitle(), intent.keywords))
                .map(e -> new SearchResult("ECO", e.getId(),
                    e.getEcoNumber(),
                    e.getTitle(),
                    e.getState() == null ? null : e.getState().name(),
                    "/plm/changes/eco/" + e.getId(),
                    keywordScore(e.getEcoNumber() + " " + e.getTitle(), intent.keywords)))
                .forEach(out::add);
        } catch (Exception ex) {
            log.warn("ECO search error: {}", ex.getMessage());
        }
    }

    // ── NL parsing via ML service (fallback: rule-based) ─────────────────

    private NlIntent parseIntent(String q) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<?> req = new HttpEntity<>(Map.of("query", q), headers);
            var resp = restTemplate.postForEntity(
                mlServiceUrl() + "/nl-parse", req, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return mapToIntent(resp.getBody());
            }
        } catch (Exception e) {
            log.debug("ML NL parse failed, using rule-based: {}", e.getMessage());
        }
        return ruleBasedIntent(q);
    }

    @SuppressWarnings("unchecked")
    private NlIntent mapToIntent(Map<?, ?> body) {
        NlIntent i = new NlIntent();
        Object et = body.get("entity_types");
        if (et instanceof List) {
            i.entityTypes = (List<String>) et;
        }
        Object kw = body.get("keywords");
        if (kw instanceof List) {
            i.keywords = (List<String>) kw;
        }
        Object st = body.get("lifecycle_state");
        if (st instanceof String) i.lifecycleState = (String) st;
        Object days = body.get("modified_after_days");
        if (days instanceof Number) i.modifiedAfterDays = ((Number) days).intValue();
        Object by = body.get("created_by");
        if (by instanceof String) i.createdBy = (String) by;
        return i;
    }

    private NlIntent ruleBasedIntent(String q) {
        NlIntent i = new NlIntent();
        String ql = q.toLowerCase();
        if (ql.contains("part") || ql.contains("component") || ql.contains("assembl")) i.entityTypes.add("PART");
        if (ql.contains("document") || ql.contains(" doc ") || ql.contains("docs")) i.entityTypes.add("DOCUMENT");
        if (ql.contains("ecr") || ql.contains("change request")) i.entityTypes.add("ECR");
        if (ql.contains("eco") || ql.contains("change order")) i.entityTypes.add("ECO");

        if (ql.contains("released")) i.lifecycleState = "RELEASED";
        else if (ql.contains("draft")) i.lifecycleState = "DRAFT";
        else if (ql.contains("obsolete")) i.lifecycleState = "OBSOLETE";
        else if (ql.contains("in review") || ql.contains("review")) i.lifecycleState = "IN_REVIEW";

        java.util.regex.Matcher m = java.util.regex.Pattern.compile("last\\s+(\\d+)\\s+days?").matcher(ql);
        if (m.find()) i.modifiedAfterDays = Integer.parseInt(m.group(1));
        else if (ql.contains("last week")) i.modifiedAfterDays = 7;
        else if (ql.contains("last month")) i.modifiedAfterDays = 30;

        // remaining tokens as keywords
        Set<String> stop = Set.of("show","me","all","the","a","an","in","of","for","that",
            "were","modified","created","changed","last","and","or","with","by","is","are",
            "have","has","been","days","week","month","released","draft","obsolete","review");
        i.keywords = Arrays.stream(ql.split("\\W+"))
            .filter(t -> !t.isEmpty() && t.length() > 1 && !stop.contains(t))
            .distinct().limit(6).collect(Collectors.toList());
        return i;
    }

    // ── utilities ─────────────────────────────────────────────────────────

    private boolean matchState(String entityState, String filterState) {
        if (filterState == null || filterState.isBlank()) return true;
        if (entityState == null) return false;
        return entityState.equalsIgnoreCase(filterState);
    }

    private boolean matchKeywords(String text, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return true;
        String lower = text == null ? "" : text.toLowerCase();
        return keywords.stream().anyMatch(lower::contains);
    }

    private double keywordScore(String text, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) return 0.5;
        String lower = text == null ? "" : text.toLowerCase();
        long hits = keywords.stream().filter(lower::contains).count();
        return (double) hits / keywords.size();
    }

    private String mlServiceUrl() {
        return configuredMlServiceUrl;
    }

    // ── inner types ───────────────────────────────────────────────────────

    static class NlIntent {
        public List<String> entityTypes = new ArrayList<>();
        public List<String> keywords = new ArrayList<>();
        public String lifecycleState;
        public Integer modifiedAfterDays;
        public String createdBy;
    }

    record SearchResult(
        String type,
        Long id,
        String number,
        String title,
        String state,
        String path,
        double score
    ) {}

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("OK").data(data).build());
    }
}
