package com.windchill.api.document;

import com.windchill.api.common.ApiResponse;
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

    // ── List ──────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<WTDocumentDto>>> list(
            @RequestParam Long contextId,
            @RequestParam(required = false) String docType) {
        return ResponseEntity.ok(ApiResponse.success(service.listByContext(contextId, docType)));
    }

    // ── Get ───────────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WTDocumentDto>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    // ── Create ────────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<ApiResponse<WTDocumentDto>> create(
            @RequestBody WTDocumentCreateRequest req,
            Authentication auth) {
        WTDocumentDto dto = service.create(req, auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WTDocumentDto>> update(
            @PathVariable Long id,
            @RequestBody WTDocumentUpdateRequest req,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.update(id, req, auth.getName())));
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<WTDocumentDto>> promote(
            @PathVariable Long id,
            @RequestParam String target,
            Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.promote(id, target, auth.getName())));
    }

    // ── Checkout ──────────────────────────────────────────────────────────────
    @PostMapping("/{id}/checkout")
    public ResponseEntity<ApiResponse<WTDocumentDto>> checkOut(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.checkOut(id, auth.getName())));
    }

    @PostMapping("/{id}/checkin")
    public ResponseEntity<ApiResponse<WTDocumentDto>> checkIn(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.checkIn(id, auth.getName())));
    }

    @PostMapping("/{id}/undo-checkout")
    public ResponseEntity<ApiResponse<WTDocumentDto>> undoCheckOut(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.undoCheckOut(id, auth.getName())));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id, Authentication auth) {
        service.delete(id, auth.getName());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ── Part ↔ Doc links ─────────────────────────────────────────────────────
    @GetMapping("/by-part/{partId}")
    public ResponseEntity<ApiResponse<List<WTDocumentDto>>> byPart(@PathVariable Long partId) {
        return ResponseEntity.ok(ApiResponse.success(service.listByPart(partId)));
    }

    @PostMapping("/{id}/link-part/{partId}")
    public ResponseEntity<ApiResponse<Void>> linkPart(
            @PathVariable Long id, @PathVariable Long partId) {
        service.linkToPart(id, partId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}/link-part/{partId}")
    public ResponseEntity<ApiResponse<Void>> unlinkPart(
            @PathVariable Long id, @PathVariable Long partId) {
        service.unlinkFromPart(id, partId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
