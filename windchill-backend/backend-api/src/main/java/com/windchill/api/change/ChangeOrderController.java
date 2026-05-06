package com.windchill.api.change;

import com.windchill.service.change.ChangeOrderCreateRequest;
import com.windchill.service.change.ChangeOrderDto;
import com.windchill.service.change.IChangeOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.windchill.api.security.AuthenticatedUser;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/plm/changes/eco")
@RequiredArgsConstructor
public class ChangeOrderController {

    private final IChangeOrderService service;

    @GetMapping("/context/{contextId}")
    public ResponseEntity<List<ChangeOrderDto>> listByContext(
            @PathVariable Long contextId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.listByContext(contextId));
    }

    @GetMapping("/by-ecr/{ecrId}")
    public ResponseEntity<List<ChangeOrderDto>> listByEcr(
            @PathVariable Long ecrId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.listByEcr(ecrId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChangeOrderDto> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<ChangeOrderDto> create(
            @Valid @RequestBody ChangeOrderCreateRequest req,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(req, user.getUsername()));
    }

    @PostMapping("/{id}/promote")
    public ResponseEntity<ChangeOrderDto> promote(
            @PathVariable Long id,
            @RequestParam String targetState,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.promote(id, targetState, user.getUsername()));
    }

    @PostMapping("/{id}/ai-result")
    public ResponseEntity<ChangeOrderDto> linkAiResult(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.linkAiResult(
            id,
            body.get("riskScore"),
            body.get("confidence"),
            body.get("costEstimate"),
            user.getUsername()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        service.delete(id, user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
