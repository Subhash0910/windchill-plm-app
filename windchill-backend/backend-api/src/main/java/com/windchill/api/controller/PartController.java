package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import com.windchill.service.plm.IPartService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/parts")
@RequiredArgsConstructor
@Slf4j
public class PartController {

    private final IPartService partService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Part part) {
        Part created = partService.createPart(part);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(created).build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam Long contextId) {
        List<Part> parts = partService.listParts(contextId);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(parts).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable Long id) {
        Part part = partService.getPart(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(part).build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id, @RequestBody Part details) {
        Part updated = partService.updatePart(id, details);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(updated).build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        partService.deletePart(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("Part deleted successfully").data(null).build());
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<?>> promote(@PathVariable Long id, @RequestParam LifecycleStateEnum target) {
        Part updated = partService.promote(id, target);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(updated).build());
    }

    @PostMapping("/{id}/revise")
    public ResponseEntity<ApiResponse<?>> revise(@PathVariable Long id) {
        Part newRev = partService.revise(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(newRev).build());
    }

    @GetMapping("/{id}/where-used")
    public ResponseEntity<ApiResponse<?>> whereUsed(@PathVariable Long id) {
        List<Part> parents = partService.whereUsed(id);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(parents).build());
    }
}
