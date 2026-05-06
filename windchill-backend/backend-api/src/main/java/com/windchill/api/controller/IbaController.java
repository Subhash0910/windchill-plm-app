package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.IbaAttributeDefinition;
import com.windchill.domain.entity.IbaAttributeValue;
import com.windchill.repository.IbaAttributeDefinitionRepository;
import com.windchill.repository.IbaAttributeValueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * IbaController — Windchill IBA (Inter-Business Attributes) REST API.
 *
 * Provides CRUD for soft-type attribute definitions and values, allowing
 * custom attributes to be added to any entity type (PART, DOCUMENT, ECR, ECO).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/plm/iba")
@RequiredArgsConstructor
public class IbaController {

    private final IbaAttributeDefinitionRepository definitionRepo;
    private final IbaAttributeValueRepository valueRepo;

    // ── Attribute Definitions ─────────────────────────────────────────────

    /**
     * GET /api/v1/plm/iba/definitions?targetType=PART
     *
     * List all active IBA attribute definitions for a target entity type.
     */
    @GetMapping("/definitions")
    public ResponseEntity<ApiResponse<?>> listDefinitions(
            @RequestParam String targetType) {
        var defs = definitionRepo.findByTargetTypeAndIsActiveTrueOrderBySortOrderAsc(targetType);
        return ok(defs);
    }

    /**
     * POST /api/v1/plm/iba/definitions
     *
     * Create a new IBA attribute definition.
     */
    @PostMapping("/definitions")
    public ResponseEntity<ApiResponse<?>> createDefinition(
            @RequestBody IbaAttributeDefinition definition) {
        var saved = definitionRepo.save(definition);
        log.info("Created IBA definition: {} for {}", saved.getAttributeName(), saved.getTargetType());
        return ok(saved, APIConstants.CREATED);
    }

    /**
     * PUT /api/v1/plm/iba/definitions/{id}
     *
     * Update an existing IBA attribute definition.
     */
    @PutMapping("/definitions/{id}")
    public ResponseEntity<ApiResponse<?>> updateDefinition(
            @PathVariable Long id,
            @RequestBody IbaAttributeDefinition updates) {
        var existing = definitionRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("IBA definition not found: " + id));

        if (updates.getAttributeName() != null) existing.setAttributeName(updates.getAttributeName());
        if (updates.getDataType() != null) existing.setDataType(updates.getDataType());
        if (updates.getDisplayName() != null) existing.setDisplayName(updates.getDisplayName());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getDefaultValue() != null) existing.setDefaultValue(updates.getDefaultValue());
        if (updates.getIsRequired() != null) existing.setIsRequired(updates.getIsRequired());
        if (updates.getIsSearchable() != null) existing.setIsSearchable(updates.getIsSearchable());
        if (updates.getValidationRegex() != null) existing.setValidationRegex(updates.getValidationRegex());
        if (updates.getMinValue() != null) existing.setMinValue(updates.getMinValue());
        if (updates.getMaxValue() != null) existing.setMaxValue(updates.getMaxValue());
        if (updates.getOptionValues() != null) existing.setOptionValues(updates.getOptionValues());
        if (updates.getSortOrder() != null) existing.setSortOrder(updates.getSortOrder());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());

        var saved = definitionRepo.save(existing);
        return ok(saved, APIConstants.UPDATED);
    }

    /**
     * DELETE /api/v1/plm/iba/definitions/{id}
     *
     * Soft-delete an IBA attribute definition (sets isActive = false).
     */
    @DeleteMapping("/definitions/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<?>> deleteDefinition(@PathVariable Long id) {
        var def = definitionRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("IBA definition not found: " + id));
        def.setIsActive(false);
        definitionRepo.save(def);
        log.info("Soft-deleted IBA definition: {}", def.getAttributeName());
        return ok(null, APIConstants.DELETED);
    }

    // ── Attribute Values ──────────────────────────────────────────────────

    /**
     * GET /api/v1/plm/iba/values/{entityId}
     *
     * Get all IBA values for a specific entity.
     * Returns a map of attributeName → value with definition metadata.
     */
    @GetMapping("/values/{entityId}")
    public ResponseEntity<ApiResponse<?>> getValues(@PathVariable Long entityId) {
        var values = valueRepo.findByEntityId(entityId);

        var enriched = values.stream().map(v -> {
            var def = definitionRepo.findById(v.getDefinitionId()).orElse(null);
            return Map.of(
                "id", v.getId(),
                "definitionId", v.getDefinitionId(),
                "attributeName", def != null ? def.getAttributeName() : "unknown",
                "dataType", def != null ? def.getDataType() : "STRING",
                "displayName", def != null ? def.getDisplayName() : "",
                "value", v.getAttributeValue()
            );
        }).collect(Collectors.toList());

        return ok(Map.of("entityId", entityId, "values", enriched));
    }

    /**
     * POST /api/v1/plm/iba/values
     *
     * Save or update IBA values for an entity.
     *
     * Request body:
     * {
     *   "entityId": 42,
     *   "values": [
     *     { "definitionId": 1, "value": "Steel" },
     *     { "definitionId": 2, "value": "42.5" }
     *   ]
     * }
     */
    @PostMapping("/values")
    @Transactional
    public ResponseEntity<ApiResponse<?>> saveValues(@RequestBody Map<String, Object> body) {
        var entityId = ((Number) body.get("entityId")).longValue();

        @SuppressWarnings("unchecked")
        var valuesList = (List<Map<String, Object>>) body.get("values");

        if (valuesList == null || valuesList.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                .success(false).message("values array is required").build());
        }

        for (var entry : valuesList) {
            var definitionId = ((Number) entry.get("definitionId")).longValue();
            var value = (String) entry.get("value");

            var existing = valueRepo.findByEntityIdAndDefinitionId(entityId, definitionId);
            if (existing.isPresent()) {
                existing.get().setAttributeValue(value);
                valueRepo.save(existing.get());
            } else {
                var newVal = new IbaAttributeValue();
                newVal.setEntityId(entityId);
                newVal.setDefinitionId(definitionId);
                newVal.setAttributeValue(value);
                valueRepo.save(newVal);
            }
        }

        log.info("Saved {} IBA values for entity {}", valuesList.size(), entityId);
        return ok(Map.of("entityId", entityId, "saved", valuesList.size()),
            APIConstants.UPDATED);
    }

    /**
     * PUT /api/v1/plm/iba/values/{id}
     *
     * Update a single IBA value by its ID.
     *
     * Request body: { "value": "newValue" }
     */
    @PutMapping("/values/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<?>> updateValue(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        var value = valueRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("IBA value not found: " + id));
        value.setAttributeValue(body.get("value"));
        var saved = valueRepo.save(value);
        return ok(saved, APIConstants.UPDATED);
    }

    // ── Helper ─────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ok(data, APIConstants.SUCCESS);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data, String message) {
        return ResponseEntity.ok(ApiResponse.builder()
            .success(true).message(message).data(data).build());
    }
}
