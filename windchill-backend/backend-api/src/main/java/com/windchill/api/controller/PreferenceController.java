package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.Preference;
import com.windchill.service.plm.IPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final IPreferenceService preferenceService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String scope) {
        if (scope != null && !scope.isBlank()) {
            return ok(preferenceService.listByScope(scope));
        }
        return ok(preferenceService.listByCategory(category));
    }

    @GetMapping("/resolve")
    public ResponseEntity<ApiResponse<?>> resolve(
            @RequestParam String key,
            @RequestParam(required = false) Long contextId,
            @RequestParam(required = false) Long userId) {
        String value = preferenceService.resolveValue(key, contextId, userId);
        return ok(Map.of("key", key, "value", value));
    }

    @GetMapping("/resolved-all")
    public ResponseEntity<ApiResponse<?>> resolveAll(
            @RequestParam(required = false) Long contextId,
            @RequestParam(required = false) Long userId) {
        return ok(preferenceService.getAllResolved(contextId, userId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createOrUpdate(@RequestBody Preference preference) {
        return ok(preferenceService.createOrUpdate(preference), APIConstants.CREATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        preferenceService.deletePreference(id);
        return ok(null, APIConstants.DELETED);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ok(data, APIConstants.SUCCESS);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data, String message) {
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .build());
    }
}
