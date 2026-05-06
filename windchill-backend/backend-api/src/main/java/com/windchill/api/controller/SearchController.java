package com.windchill.api.controller;

import com.windchill.api.document.WTDocument;
import com.windchill.api.document.WTDocumentRepository;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.ChangeOrder;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Part;
import com.windchill.repository.ChangeOrderRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/plm/search")
@RequiredArgsConstructor
public class SearchController {

    private final PartRepository partRepository;
    private final WTDocumentRepository documentRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final ChangeOrderRepository changeOrderRepository;

    private static final int MAX_PER_CATEGORY = 10;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> search(
            @RequestParam String q,
            @RequestParam(required = false) Long contextId) {

        if (q == null || q.isBlank()) {
            return ok(Map.of("query", "", "totalHits", 0,
                    "parts", List.of(), "documents", List.of(),
                    "ecrs", List.of(), "ecos", List.of()));
        }

        String keyword = q.trim();

        List<Map<String, Object>> parts     = searchParts(keyword, contextId);
        List<Map<String, Object>> documents = searchDocuments(keyword, contextId);
        List<Map<String, Object>> ecrs      = searchEcrs(keyword, contextId);
        List<Map<String, Object>> ecos      = searchEcos(keyword, contextId);

        int totalHits = parts.size() + documents.size() + ecrs.size() + ecos.size();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("query", keyword);
        result.put("totalHits", totalHits);
        result.put("parts", parts);
        result.put("documents", documents);
        result.put("ecrs", ecrs);
        result.put("ecos", ecos);

        return ok(result);
    }

    private List<Map<String, Object>> searchParts(String keyword, Long contextId) {
        List<Part> parts = (contextId != null)
                ? partRepository.searchByKeywordInContext(contextId, keyword)
                : partRepository.searchByKeyword(keyword);

        return parts.stream()
                .limit(MAX_PER_CATEGORY)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", p.getId());
                    m.put("partNumber", p.getPartNumber());
                    m.put("name", p.getName());
                    m.put("revision", p.getRevision());
                    m.put("lifecycleState", p.getLifecycleState().name());
                    m.put("type", "part");
                    return m;
                }).toList();
    }

    private List<Map<String, Object>> searchDocuments(String keyword, Long contextId) {
        List<WTDocument> docs = (contextId != null)
                ? documentRepository.search(contextId, keyword)
                : documentRepository.searchAll(keyword);

        return docs.stream()
                .limit(MAX_PER_CATEGORY)
                .map(d -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", d.getId());
                    m.put("docNumber", d.getDocNumber());
                    m.put("name", d.getName());
                    m.put("docType", d.getDocType());
                    m.put("lifecycleState", d.getLifecycleState().name());
                    m.put("type", "document");
                    return m;
                }).toList();
    }

    private List<Map<String, Object>> searchEcrs(String keyword, Long contextId) {
        List<ChangeRequest> crs = (contextId != null)
                ? changeRequestRepository.searchByKeywordInContext(contextId, keyword)
                : changeRequestRepository.searchByKeyword(keyword);

        return crs.stream()
                .limit(MAX_PER_CATEGORY)
                .map(cr -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", cr.getId());
                    m.put("changeNumber", cr.getChangeNumber());
                    m.put("title", cr.getTitle());
                    m.put("status", cr.getStatus().name());
                    m.put("priority", cr.getPriority().name());
                    m.put("type", "ecr");
                    return m;
                }).toList();
    }

    private List<Map<String, Object>> searchEcos(String keyword, Long contextId) {
        List<ChangeOrder> cos = (contextId != null)
                ? changeOrderRepository.search(contextId, keyword)
                : changeOrderRepository.searchAll(keyword);

        return cos.stream()
                .limit(MAX_PER_CATEGORY)
                .map(co -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", co.getId());
                    m.put("ecoNumber", co.getEcoNumber());
                    m.put("title", co.getTitle());
                    m.put("state", co.getState().name());
                    m.put("type", "eco");
                    return m;
                }).toList();
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message("Success").data(data).build());
    }
}
