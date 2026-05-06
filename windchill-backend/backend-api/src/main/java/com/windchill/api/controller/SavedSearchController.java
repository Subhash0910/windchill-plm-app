package com.windchill.api.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.windchill.api.dto.search.CreateSavedSearchRequest;
import com.windchill.api.dto.search.SavedSearchDto;
import com.windchill.api.dto.search.UpdateSavedSearchRequest;
import com.windchill.common.response.ApiResponse;
import com.windchill.common.security.CurrentUserProvider;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Document;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.SavedSearch;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.DocumentRepository;
import com.windchill.repository.PartRepository;
import com.windchill.repository.SavedSearchRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/plm/saved-searches")
@RequiredArgsConstructor
public class SavedSearchController {

    private final SavedSearchRepository savedSearchRepository;
    private final PartRepository partRepository;
    private final DocumentRepository documentRepository;
    private final ChangeRequestRepository changeRequestRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ObjectMapper objectMapper;

    // ── mappers ────────────────────────────────────────────────────────────

    private SavedSearchDto toDto(SavedSearch s) {
        SavedSearchDto dto = new SavedSearchDto();
        dto.setId(s.getId());
        dto.setUserId(s.getUserId());
        dto.setName(s.getName());
        dto.setEntityType(s.getEntityType());
        dto.setQueryJson(s.getQueryJson());
        dto.setIsPublic(s.getIsPublic());
        dto.setSortBy(s.getSortBy());
        dto.setSortDir(s.getSortDir());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }

    // ── endpoints ──────────────────────────────────────────────────────────

    /**
     * GET /api/v1/plm/saved-searches?entityType=PART
     * List saved searches for the current user, optionally filtered by entityType.
     * When entityType is provided, also returns public searches for that type.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SavedSearchDto>>> list(
            @RequestParam(required = false) String entityType) {
        Long userId = currentUserProvider.getUserId();
        List<SavedSearch> searches;

        if (entityType != null) {
            // user's own + public for this entity type
            List<SavedSearch> own = savedSearchRepository.findByUserIdAndIsDeletedFalse(userId)
                    .stream()
                    .filter(s -> entityType.equalsIgnoreCase(s.getEntityType()))
                    .collect(Collectors.toList());
            List<SavedSearch> publicSearches = savedSearchRepository
                    .findByEntityTypeAndIsPublicTrueAndIsDeletedFalse(entityType.toUpperCase());
            searches = new ArrayList<>();
            searches.addAll(own);
            for (SavedSearch pub : publicSearches) {
                if (searches.stream().noneMatch(s -> s.getId().equals(pub.getId()))) {
                    searches.add(pub);
                }
            }
        } else {
            searches = savedSearchRepository.findByUserIdAndIsDeletedFalse(userId);
        }

        List<SavedSearchDto> dtos = searches.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /**
     * POST /api/v1/plm/saved-searches
     * Create a new saved search for the current user.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SavedSearchDto>> create(
            @Valid @RequestBody CreateSavedSearchRequest req) {
        SavedSearch s = new SavedSearch();
        s.setUserId(currentUserProvider.getUserId());
        s.setName(req.getName());
        s.setEntityType(req.getEntityType().toUpperCase());
        s.setQueryJson(req.getQueryJson());
        s.setIsPublic(req.getIsPublic() != null ? req.getIsPublic() : false);
        s.setSortBy(req.getSortBy());
        s.setSortDir(req.getSortDir());
        s = savedSearchRepository.save(s);
        return ResponseEntity.ok(ApiResponse.success(toDto(s)));
    }

    /**
     * PUT /api/v1/plm/saved-searches/{id}
     * Update an existing saved search.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SavedSearchDto>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSavedSearchRequest req) {
        SavedSearch s = savedSearchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Saved search not found: " + id));
        if (req.getName() != null) s.setName(req.getName());
        if (req.getQueryJson() != null) s.setQueryJson(req.getQueryJson());
        if (req.getIsPublic() != null) s.setIsPublic(req.getIsPublic());
        if (req.getSortBy() != null) s.setSortBy(req.getSortBy());
        if (req.getSortDir() != null) s.setSortDir(req.getSortDir());
        s = savedSearchRepository.save(s);
        return ResponseEntity.ok(ApiResponse.success(toDto(s)));
    }

    /**
     * DELETE /api/v1/plm/saved-searches/{id}
     * Soft-delete a saved search.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        SavedSearch s = savedSearchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Saved search not found: " + id));
        s.setIsDeleted(true);
        savedSearchRepository.save(s);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    /**
     * POST /api/v1/plm/saved-searches/{id}/execute
     * Execute a saved search: parse queryJson filters and query the appropriate
     * repository based on entityType.
     */
    @PostMapping("/{id}/execute")
    public ResponseEntity<ApiResponse<List<?>>> execute(@PathVariable Long id) {
        SavedSearch s = savedSearchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Saved search not found: " + id));

        Map<String, String> filters;
        try {
            filters = objectMapper.readValue(s.getQueryJson(), new TypeReference<Map<String, String>>() {});
        } catch (Exception e) {
            filters = Map.of();
        }

        List<?> results;
        switch (s.getEntityType().toUpperCase()) {
            case "PART":
                results = executePartSearch(filters);
                break;
            case "DOCUMENT":
                results = executeDocumentSearch(filters);
                break;
            case "ECR":
            case "ECO":
                results = executeChangeRequestSearch(filters);
                break;
            default:
                results = List.of();
        }

        return ResponseEntity.ok(ApiResponse.success(results));
    }

    // ── filter-to-Specification builders ────────────────────────────────────

    private List<Part> executePartSearch(Map<String, String> filters) {
        Specification<Part> spec = Specification.where(null);
        for (Map.Entry<String, String> entry : filters.entrySet()) {
            spec = spec.and(partSpec(entry.getKey(), entry.getValue()));
        }
        return partRepository.findAll(spec);
    }

    private Specification<Part> partSpec(String key, String value) {
        switch (key) {
            case "partNumber":
                return (root, query, cb) -> cb.like(cb.lower(root.get("partNumber")), "%" + value.toLowerCase() + "%");
            case "name":
                return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + value.toLowerCase() + "%");
            case "lifecycleState":
                return (root, query, cb) -> cb.equal(root.get("lifecycleState"),
                        com.windchill.common.enums.LifecycleStateEnum.valueOf(value));
            case "description":
                return (root, query, cb) -> cb.like(cb.lower(root.get("description")), "%" + value.toLowerCase() + "%");
            case "revision":
                return (root, query, cb) -> cb.equal(root.get("revision"), value);
            default:
                return Specification.where(null);
        }
    }

    private List<Document> executeDocumentSearch(Map<String, String> filters) {
        Specification<Document> spec = Specification.where(null);
        for (Map.Entry<String, String> entry : filters.entrySet()) {
            spec = spec.and(docSpec(entry.getKey(), entry.getValue()));
        }
        return documentRepository.findAll(spec);
    }

    private Specification<Document> docSpec(String key, String value) {
        switch (key) {
            case "documentNumber":
                return (root, query, cb) -> cb.like(cb.lower(root.get("documentNumber")), "%" + value.toLowerCase() + "%");
            case "title":
                return (root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + value.toLowerCase() + "%");
            case "status":
                return (root, query, cb) -> cb.equal(root.get("status"),
                        com.windchill.common.enums.StatusEnum.valueOf(value));
            case "documentType":
                return (root, query, cb) -> cb.equal(root.get("documentType"), value);
            case "description":
                return (root, query, cb) -> cb.like(cb.lower(root.get("description")), "%" + value.toLowerCase() + "%");
            default:
                return Specification.where(null);
        }
    }

    private List<ChangeRequest> executeChangeRequestSearch(Map<String, String> filters) {
        Specification<ChangeRequest> spec = Specification.where(null);
        for (Map.Entry<String, String> entry : filters.entrySet()) {
            spec = spec.and(crSpec(entry.getKey(), entry.getValue()));
        }
        return changeRequestRepository.findAll(spec);
    }

    private Specification<ChangeRequest> crSpec(String key, String value) {
        switch (key) {
            case "status":
                return (root, query, cb) -> cb.equal(root.get("status"),
                        com.windchill.common.enums.ChangeRequestStatus.valueOf(value));
            case "priority":
                return (root, query, cb) -> cb.equal(root.get("priority"),
                        com.windchill.common.enums.ChangePriority.valueOf(value));
            case "title":
                return (root, query, cb) -> cb.like(cb.lower(root.get("title")), "%" + value.toLowerCase() + "%");
            case "changeNumber":
                return (root, query, cb) -> cb.like(cb.lower(root.get("changeNumber")), "%" + value.toLowerCase() + "%");
            case "createdBy":
                return (root, query, cb) -> cb.equal(root.get("createdBy"), value);
            case "description":
                return (root, query, cb) -> cb.like(cb.lower(root.get("description")), "%" + value.toLowerCase() + "%");
            default:
                return Specification.where(null);
        }
    }
}
