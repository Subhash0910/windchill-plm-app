package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.NumberingScheme;
import com.windchill.service.plm.INumberingSchemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/numbering")
@RequiredArgsConstructor
public class NumberingController {

    private final INumberingSchemeService numberingSchemeService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) String targetType) {
        if (targetType != null && !targetType.isBlank()) {
            return ok(numberingSchemeService.listByTargetType(targetType));
        }
        return ok(numberingSchemeService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable Long id) {
        return ok(numberingSchemeService.getScheme(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody NumberingScheme scheme) {
        return ok(numberingSchemeService.create(scheme), APIConstants.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id, @RequestBody NumberingScheme details) {
        return ok(numberingSchemeService.update(id, details), APIConstants.UPDATED);
    }

    @PostMapping("/{id}/reset")
    public ResponseEntity<ApiResponse<?>> reset(@PathVariable Long id) {
        return ok(numberingSchemeService.resetSequence(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<?>> generate(@RequestParam String targetType) {
        String number = numberingSchemeService.generateNumber(targetType);
        return ok(Map.of("targetType", targetType, "generatedNumber", number));
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
