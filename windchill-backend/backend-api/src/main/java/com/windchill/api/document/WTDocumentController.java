package com.windchill.api.document;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/documents")
@RequiredArgsConstructor
public class WTDocumentController {

    private final WTDocumentService service;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(
            @RequestParam(required = false) Long contextId,
            @RequestParam(required = false) String docType) {
        return ok(service.listByContext(contextId, docType));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable Long id) {
        return ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(
            @Valid @RequestBody WTDocumentCreateRequest req,
            Authentication auth) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.builder()
                        .success(true)
                        .message(APIConstants.CREATED)
                        .data(service.create(req, auth.getName()))
                        .build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable Long id,
            @Valid @RequestBody WTDocumentUpdateRequest req,
            Authentication auth) {
        return ok(service.update(id, req, auth.getName()));
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<?>> promote(
            @PathVariable Long id,
            @RequestParam String target,
            Authentication auth) {
        return ok(service.promote(id, target, auth.getName()));
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<ApiResponse<?>> checkOut(
            @PathVariable Long id, Authentication auth) {
        return ok(service.checkOut(id, auth.getName()));
    }

    @PostMapping("/{id}/checkin")
    public ResponseEntity<ApiResponse<?>> checkIn(
            @PathVariable Long id, Authentication auth) {
        return ok(service.checkIn(id, auth.getName()));
    }

    @PostMapping("/{id}/undo-checkout")
    public ResponseEntity<ApiResponse<?>> undoCheckOut(
            @PathVariable Long id, Authentication auth) {
        return ok(service.undoCheckOut(id, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> delete(
            @PathVariable Long id, Authentication auth) {
        service.delete(id, auth.getName());
        return ok(null, APIConstants.DELETED);
    }

    @GetMapping("/by-part/{partId}")
    public ResponseEntity<ApiResponse<?>> byPart(@PathVariable Long partId) {
        return ok(service.listByPart(partId));
    }

    @GetMapping("/by-doc/{docId}")
    public ResponseEntity<ApiResponse<?>> byDoc(@PathVariable Long docId) {
        return ok(service.listRelatedParts(docId));
    }

    @PostMapping("/{id}/link-part/{partId}")
    public ResponseEntity<ApiResponse<?>> linkPart(
            @PathVariable Long id, @PathVariable Long partId) {
        service.linkToPart(id, partId);
        return ok(null);
    }

    @DeleteMapping("/{id}/link-part/{partId}")
    public ResponseEntity<ApiResponse<?>> unlinkPart(
            @PathVariable Long id, @PathVariable Long partId) {
        service.unlinkFromPart(id, partId);
        return ok(null);
    }

    // ─── helpers ──────────────────────────────────────────────────────────────

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ok(data, APIConstants.SUCCESS);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data, String message) {
        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message(message).data(data).build());
    }
}
