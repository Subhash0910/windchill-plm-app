package com.windchill.plm.controller;

import com.windchill.plm.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * SearchController — GET /api/search
 *
 * Supports cross-type keyword/attribute search.
 *
 * Query params:
 *   q     (required)  – keyword
 *   type  (optional)  – PART | DOCUMENT | PRODUCT | PROJECT | ECR | ALL
 *   state (optional)  – INWORK | UNDER_REVIEW | RELEASED | OBSOLETE | …
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    // GET /api/search?q=ENG-001&type=PART&state=RELEASED
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> search(
            @RequestParam String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String state) {

        if (q == null || q.trim().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query parameter 'q' is required"));
        }

        List<Map<String, Object>> results = searchService.search(q, type, state);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("query",   q);
        response.put("type",    type != null ? type : "ALL");
        response.put("state",   state);
        response.put("count",   results.size());
        response.put("results", results);

        return ResponseEntity.ok(response);
    }

    // GET /api/search/part?q=ENG  (type-specific shorthand)
    @GetMapping("/{objectType}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> searchByType(
            @PathVariable String objectType,
            @RequestParam String q,
            @RequestParam(required = false) String state) {

        List<Map<String, Object>> results = searchService.search(q, objectType.toUpperCase(), state);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("query",   q);
        response.put("type",    objectType.toUpperCase());
        response.put("state",   state);
        response.put("count",   results.size());
        response.put("results", results);

        return ResponseEntity.ok(response);
    }
}
