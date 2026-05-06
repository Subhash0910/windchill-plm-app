package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.ChangeNoticeStatus;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.domain.entity.ChangeNotice;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.repository.ChangeNoticeRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.UserRepository;
import com.windchill.service.INotificationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/changes/ecn")
@RequiredArgsConstructor
public class ChangeNoticeController {

    private final ChangeNoticeRepository repo;
    private final ChangeRequestRepository ecrRepo;
    private final UserRepository userRepo;
    private final INotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> list(@RequestParam Long contextId) {
        return ok(repo.findByContextIdOrderByCreatedAtDesc(contextId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> get(@PathVariable Long id) {
        ChangeNotice ecn = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ECN not found: " + id));
        return ok(ecn);
    }

    /** Create a standalone ECN (or auto-linked from an ECR). */
    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(
            @Valid @RequestBody CreateRequest req,
            @AuthenticationPrincipal UserDetails principal) {

        ChangeNotice ecn = new ChangeNotice();
        ecn.setContextId(req.getContextId());
        ecn.setChangeRequestId(req.getChangeRequestId());
        ecn.setTitle(req.getTitle());
        ecn.setSummary(req.getSummary());
        ecn.setCreatedBy(principal.getUsername());
        ecn.setNoticeNumber(generateNumber());

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.builder().success(true).message("Created").data(repo.save(ecn)).build());
    }

    /** Promote ECN: OPEN → RELEASED or RELEASED → OBSOLETE */
    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<?>> promote(
            @PathVariable Long id,
            @RequestParam String target,
            @AuthenticationPrincipal UserDetails principal) {

        ChangeNotice ecn = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ECN not found: " + id));

        ChangeNoticeStatus next = ChangeNoticeStatus.valueOf(target.toUpperCase());
        validateTransition(ecn.getStatus(), next);

        ecn.setStatus(next);
        if (next == ChangeNoticeStatus.RELEASED) {
            ecn.setReleasedBy(principal.getUsername());
            ecn.setReleasedAt(LocalDateTime.now());
        }
        ChangeNotice saved = repo.save(ecn);

        // Notify the ECR creator that the change notice has progressed
        if (next == ChangeNoticeStatus.RELEASED && saved.getChangeRequestId() != null) {
            ecrRepo.findById(saved.getChangeRequestId()).ifPresent(ecr -> {
                String creator = ecr.getCreatedBy();
                if (creator != null && !creator.equals(principal.getUsername())) {
                    try {
                        userRepo.findByUsername(creator).ifPresent(u ->
                            notificationService.create(u.getId(),
                                "ECN " + saved.getNoticeNumber() + " released",
                                saved.getTitle() + " has been released to manufacturing.",
                                "ECN_RELEASED", "CHANGE_NOTICE", saved.getId(), saved.getNoticeNumber())
                        );
                    } catch (Exception ignored) { }
                }
            });
        }
        return ok(saved);
    }

    /** Get the ECN linked to a specific ECR (auto-created on ECR approval). */
    @GetMapping("/by-ecr/{ecrId}")
    public ResponseEntity<ApiResponse<?>> byEcr(@PathVariable Long ecrId) {
        return repo.findByChangeRequestId(ecrId)
            .map(this::ok)
            .orElse(ok(null));
    }

    /** Update summary/title of an OPEN ECN. */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> update(
            @PathVariable Long id,
            @RequestBody UpdateRequest req) {
        ChangeNotice ecn = repo.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ECN not found: " + id));
        if (ecn.getStatus() != ChangeNoticeStatus.OPEN) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.builder().success(false).message("Only OPEN ECNs can be edited").build());
        }
        if (req.getTitle() != null) ecn.setTitle(req.getTitle());
        if (req.getSummary() != null) ecn.setSummary(req.getSummary());
        return ok(repo.save(ecn));
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private void validateTransition(ChangeNoticeStatus current, ChangeNoticeStatus next) {
        boolean valid = (current == ChangeNoticeStatus.OPEN    && next == ChangeNoticeStatus.RELEASED)
                     || (current == ChangeNoticeStatus.RELEASED && next == ChangeNoticeStatus.OBSOLETE);
        if (!valid) {
            throw new com.windchill.common.exception.BusinessException(
                "Invalid ECN transition: " + current + " → " + next);
        }
    }

    private synchronized String generateNumber() {
        long count = repo.count() + 1;
        return String.format("ECN-%05d", count);
    }

    private ResponseEntity<ApiResponse<?>> ok(Object data) {
        return ResponseEntity.ok(ApiResponse.builder().success(true).message("OK").data(data).build());
    }

    // ── request DTOs ──────────────────────────────────────────────────────

    @Data
    public static class CreateRequest {
        private Long contextId;
        private Long changeRequestId;
        @NotBlank @Size(max = 255)
        private String title;
        @Size(max = 4000)
        private String summary;
    }

    @Data
    public static class UpdateRequest {
        @Size(max = 255) private String title;
        @Size(max = 4000) private String summary;
    }
}
