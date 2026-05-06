package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.ObjectTemplate;
import com.windchill.service.plm.ITemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final ITemplateService templateService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) String targetType) {
        if (targetType != null && !targetType.isBlank()) {
            return ok(templateService.listByTargetType(targetType));
        }
        return ok(templateService.listAll());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody ObjectTemplate template) {
        return ok(templateService.create(template), APIConstants.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id, @RequestBody ObjectTemplate details) {
        return ok(templateService.update(id, details), APIConstants.UPDATED);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ok(null, APIConstants.DELETED);
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<ApiResponse<?>> apply(@PathVariable Long id) {
        return ok(templateService.applyTemplate(id));
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
