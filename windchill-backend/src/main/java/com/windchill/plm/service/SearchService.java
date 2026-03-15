package com.windchill.plm.service;

import com.windchill.plm.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * SearchService — cross-type attribute search across Parts, Documents,
 * Products, Projects, ECRs, and ECNs.
 *
 * Each result is projected into a flat SearchResultDto so the frontend
 * can render a uniform table regardless of object type.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

    private final PartRepository        partRepository;
    private final DocumentRepository    documentRepository;
    private final ProductRepository     productRepository;
    private final ProjectRepository     projectRepository;
    private final ChangeRequestRepository changeRequestRepository;

    // ----------------------------------------------------------------
    //  Public API
    // ----------------------------------------------------------------

    /**
     * Cross-type search.
     *
     * @param query  keyword / part-number fragment (case-insensitive LIKE)
     * @param type   optional filter: PART | DOCUMENT | PRODUCT | PROJECT | ECR (null = ALL)
     * @param state  optional lifecycle state filter (null = ALL)
     * @return list of SearchResultDto sorted by relevance (exact matches first)
     */
    public List<Map<String, Object>> search(String query, String type, String state) {
        String q = query == null ? "" : query.trim().toLowerCase();
        List<Map<String, Object>> results = new ArrayList<>();

        boolean all = type == null || type.isBlank() || "ALL".equalsIgnoreCase(type);

        if (all || "PART".equalsIgnoreCase(type)) {
            partRepository.findAll().stream()
                .filter(p -> matchesQuery(q, p.getPartNumber(), p.getName(), p.getDescription()))
                .filter(p -> matchesState(state, p.getLifecycleState() != null ? p.getLifecycleState().name() : null))
                .forEach(p -> results.add(buildResult(
                    "PART", p.getId(), p.getPartNumber(), p.getName(),
                    p.getLifecycleState() != null ? p.getLifecycleState().name() : null,
                    p.getRevision(), p.getIteration() != null ? p.getIteration().toString() : null,
                    null, p.getUpdatedAt() != null ? p.getUpdatedAt().toString() : null,
                    p.getUpdatedBy()
                )));
        }

        if (all || "DOCUMENT".equalsIgnoreCase(type)) {
            documentRepository.findAll().stream()
                .filter(d -> matchesQuery(q, d.getDocNumber(), d.getTitle(), d.getDescription()))
                .filter(d -> matchesState(state, d.getLifecycleState() != null ? d.getLifecycleState().name() : null))
                .forEach(d -> results.add(buildResult(
                    "DOCUMENT", d.getId(), d.getDocNumber(), d.getTitle(),
                    d.getLifecycleState() != null ? d.getLifecycleState().name() : null,
                    d.getRevision(), d.getIteration() != null ? d.getIteration().toString() : null,
                    null, d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : null,
                    d.getUpdatedBy()
                )));
        }

        if (all || "PRODUCT".equalsIgnoreCase(type)) {
            productRepository.findAll().stream()
                .filter(pr -> matchesQuery(q, pr.getProductNumber(), pr.getName(), pr.getDescription()))
                .filter(pr -> matchesState(state, pr.getLifecycleState() != null ? pr.getLifecycleState().name() : null))
                .forEach(pr -> results.add(buildResult(
                    "PRODUCT", pr.getId(), pr.getProductNumber(), pr.getName(),
                    pr.getLifecycleState() != null ? pr.getLifecycleState().name() : null,
                    pr.getRevision(), null, null,
                    pr.getUpdatedAt() != null ? pr.getUpdatedAt().toString() : null,
                    null
                )));
        }

        if (all || "PROJECT".equalsIgnoreCase(type)) {
            projectRepository.findAll().stream()
                .filter(pj -> matchesQuery(q, pj.getProjectNumber(), pj.getName(), pj.getDescription()))
                .filter(pj -> matchesState(state, pj.getStatus()))
                .forEach(pj -> results.add(buildResult(
                    "PROJECT", pj.getId(), pj.getProjectNumber(), pj.getName(),
                    pj.getStatus(), null, null, null,
                    pj.getUpdatedAt() != null ? pj.getUpdatedAt().toString() : null,
                    null
                )));
        }

        if (all || "ECR".equalsIgnoreCase(type)) {
            changeRequestRepository.findAll().stream()
                .filter(cr -> matchesQuery(q, cr.getEcrNumber(), cr.getTitle(), cr.getDescription()))
                .filter(cr -> matchesState(state, cr.getState() != null ? cr.getState().name() : null))
                .forEach(cr -> results.add(buildResult(
                    "ECR", cr.getId(), cr.getEcrNumber(), cr.getTitle(),
                    cr.getState() != null ? cr.getState().name() : null,
                    null, null, null,
                    cr.getUpdatedAt() != null ? cr.getUpdatedAt().toString() : null,
                    cr.getUpdatedBy()
                )));
        }

        // Sort: exact number matches first, then name matches, then rest
        results.sort((a, b) -> {
            int sa = score(q, a);
            int sb = score(q, b);
            return Integer.compare(sb, sa);
        });

        return results;
    }

    // ----------------------------------------------------------------
    //  Helpers
    // ----------------------------------------------------------------

    private boolean matchesQuery(String q, String... fields) {
        if (q.isBlank()) return true;
        for (String f : fields) {
            if (f != null && f.toLowerCase().contains(q)) return true;
        }
        return false;
    }

    private boolean matchesState(String stateFilter, String objectState) {
        if (stateFilter == null || stateFilter.isBlank()) return true;
        return stateFilter.equalsIgnoreCase(objectState);
    }

    private Map<String, Object> buildResult(
            String type, Long id, String number, String name,
            String lifecycleState, String revision, String iteration,
            String contextId, String updatedAt, String updatedBy) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("objectType",     type);
        r.put("id",             id);
        r.put("number",         number);
        r.put("name",           name);
        r.put("lifecycleState", lifecycleState);
        r.put("revision",       revision);
        r.put("iteration",      iteration);
        r.put("contextId",      contextId);
        r.put("updatedAt",      updatedAt);
        r.put("updatedBy",      updatedBy);
        return r;
    }

    private int score(String q, Map<String, Object> result) {
        String number = result.get("number") != null ? result.get("number").toString().toLowerCase() : "";
        String name   = result.get("name")   != null ? result.get("name").toString().toLowerCase()   : "";
        if (number.equals(q) || name.equals(q))   return 100;
        if (number.startsWith(q))                  return 80;
        if (name.startsWith(q))                    return 60;
        if (number.contains(q))                    return 40;
        return 20;
    }
}
