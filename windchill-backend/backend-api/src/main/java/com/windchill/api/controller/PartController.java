package com.windchill.api.controller;

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
@RequestMapping("/api/parts")
@RequiredArgsConstructor
public class PartController {

    private final IPartService partService;

    @PostMapping
    public ResponseEntity<Part> create(@RequestBody Part part) {
        return ResponseEntity.ok(partService.createPart(part));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Part> get(@PathVariable Long id) {
        return ResponseEntity.ok(partService.getPart(id));
    }

    @GetMapping
    public ResponseEntity<List<Part>> list(@RequestParam Long contextId) {
        return ResponseEntity.ok(partService.listParts(contextId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Part> update(@PathVariable Long id, @RequestBody Part details) {
        return ResponseEntity.ok(partService.updatePart(id, details));
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<Part> promote(
            @PathVariable Long id,
            @RequestParam LifecycleStateEnum target) {
        return ResponseEntity.ok(partService.promote(id, target));
    }

    @PostMapping("/{id}/revise")
    public ResponseEntity<Part> revise(@PathVariable Long id) {
        return ResponseEntity.ok(partService.revise(id));
    }

    @GetMapping("/{id}/where-used")
    public ResponseEntity<List<Part>> whereUsed(@PathVariable Long id) {
        return ResponseEntity.ok(partService.whereUsed(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        partService.deletePart(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Part>> search(@RequestParam String q) {
        return ResponseEntity.ok(partService.searchPartsByNumber(q));
    }

    // ─────────────────────────────────────────────────────────────
    // Check Out / Check In endpoints  (Phase 0)
    // ─────────────────────────────────────────────────────────────

    /**
     * POST /api/parts/{id}/checkout
     * Locks the part to the calling user and creates a new working iteration.
     * Returns the new working-copy Part (with checkedOutBy set and iteration incremented).
     */
    @PostMapping("/{id}/checkout")
    public ResponseEntity<Part> checkOut(@PathVariable Long id) {
        Part checked = partService.checkOut(id);
        return ResponseEntity.ok(checked);
    }

    /**
     * POST /api/parts/{id}/checkin
     * Body (optional): { "name": "...", "description": "..." }
     * Commits the working copy, clears the lock, returns the committed Part.
     */
    @PostMapping("/{id}/checkin")
    public ResponseEntity<Part> checkIn(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String name = body != null ? body.get("name") : null;
        String description = body != null ? body.get("description") : null;
        Part committed = partService.checkIn(id, name, description);
        return ResponseEntity.ok(committed);
    }

    /**
     * POST /api/parts/{id}/undo-checkout
     * Discards the working copy and restores the previous iteration.
     * Returns the restored Part.
     */
    @PostMapping("/{id}/undo-checkout")
    public ResponseEntity<Part> undoCheckOut(@PathVariable Long id) {
        Part restored = partService.undoCheckOut(id);
        return ResponseEntity.ok(restored);
    }

    /**
     * GET /api/parts/{id}/version-label
     * Returns the Windchill-style version label e.g. {"version": "A.3"}
     * Useful for frontend display without fetching the full Part object.
     */
    @GetMapping("/{id}/version-label")
    public ResponseEntity<Map<String, String>> versionLabel(@PathVariable Long id) {
        Part part = partService.getPart(id);
        return ResponseEntity.ok(Map.of(
                "version", PartServiceImpl.versionLabel(part),
                "revision", part.getRevision(),
                "iteration", String.valueOf(part.getIteration()),
                "checkedOutBy", part.getCheckedOutBy() != null ? part.getCheckedOutBy() : ""
        ));
    }
}
