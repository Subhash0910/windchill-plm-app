package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.dto.PaginatedResponse;
import com.windchill.common.dto.PaginationRequest;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import com.windchill.service.plm.IPartService;
import com.windchill.service.plm.PartServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/plm/parts")
@RequiredArgsConstructor
public class PartController {

    private final IPartService partService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@RequestBody Part part) {
        return ok(partService.createPart(part), APIConstants.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable Long id) {
        return ok(partService.getPart(id));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam Long contextId,
            @RequestParam(required = false) Long folderId) {
        List<Part> parts = (folderId != null)
                ? partService.listPartsByFolder(contextId, folderId)
                : partService.listParts(contextId);
        return ok(parts);
    }

    @GetMapping("/paginated")
    public ResponseEntity<ApiResponse<?>> listPaginated(
            @RequestParam Long contextId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        PaginationRequest pagination = new PaginationRequest();
        pagination.setPage(page);
        pagination.setSize(size);
        pagination.setSortBy(sortBy);
        pagination.setSortDir(sortDir);
        PaginatedResponse<Part> result = partService.listPartsPaginated(contextId, pagination);
        return ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(@PathVariable Long id, @RequestBody Part details) {
        return ok(partService.updatePart(id, details));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(@PathVariable Long id) {
        partService.deletePart(id);
        return ok(null, APIConstants.DELETED);
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<?>> promote(
            @PathVariable Long id,
            @RequestParam LifecycleStateEnum target) {
        return ok(partService.promote(id, target));
    }

    @PostMapping("/{id}/revise")
    public ResponseEntity<ApiResponse<?>> revise(@PathVariable Long id) {
        return ok(partService.revise(id));
    }

    @GetMapping("/{id}/where-used")
    public ResponseEntity<ApiResponse<?>> whereUsed(@PathVariable Long id) {
        return ok(partService.whereUsed(id));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<?>> search(
            @RequestParam String q,
            @RequestParam(required = false) Long contextId) {
        return ok(partService.searchPartsByNumber(q));
    }

    // ─── Checkout / Checkin ───────────────────────────────────────────────────

    @PostMapping("/{id}/checkout")
    public ResponseEntity<ApiResponse<?>> checkOut(@PathVariable Long id) {
        return ok(partService.checkOut(id));
    }

    @PostMapping("/{id}/checkin")
    public ResponseEntity<ApiResponse<?>> checkIn(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String name        = body != null ? body.get("name")        : null;
        String description = body != null ? body.get("description") : null;
        return ok(partService.checkIn(id, name, description));
    }

    @PostMapping("/{id}/undo-checkout")
    public ResponseEntity<ApiResponse<?>> undoCheckOut(@PathVariable Long id) {
        return ok(partService.undoCheckOut(id));
    }

    @GetMapping("/{id}/version-label")
    public ResponseEntity<ApiResponse<?>> versionLabel(@PathVariable Long id) {
        Part part = partService.getPart(id);
        Map<String, String> label = Map.of(
                "version",      PartServiceImpl.versionLabel(part),
                "revision",     part.getRevision(),
                "iteration",    String.valueOf(part.getIteration()),
                "checkedOutBy", part.getCheckedOutBy() != null ? part.getCheckedOutBy() : ""
        );
        return ok(label);
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ok(data, APIConstants.SUCCESS);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data, String message) {
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(message).data(data).build());
    }
}
