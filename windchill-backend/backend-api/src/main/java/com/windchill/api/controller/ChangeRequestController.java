package com.windchill.api.controller;

import com.windchill.api.dto.change.*;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.response.ApiResponse;
import com.windchill.domain.entity.ChangeNotice;
import com.windchill.domain.entity.ChangeOrderItem;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.service.IChangeRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * ChangeRequestController — REST API for ECR / ECO / ECN operations.
 *
 * Base path: /api/v1/plm/changes
 *
 * Endpoints:
 *   POST   /                          create ECR
 *   GET    /                          list (filter by contextId and/or status)
 *   GET    /{id}                      get single ECR
 *   POST   /{id}/submit               DRAFT → SUBMITTED
 *   POST   /{id}/start-review         SUBMITTED → IN_REVIEW
 *   POST   /{id}/approve              IN_REVIEW → APPROVED (triggers revisions + ECN)
 *   POST   /{id}/reject               IN_REVIEW → REJECTED
 *   POST   /{id}/close                APPROVED|REJECTED → CLOSED
 *   POST   /{id}/reopen               REJECTED → DRAFT
 *   GET    /{id}/order-items          list ChangeOrderItems for this ECR
 *   GET    /{id}/notice               get ECN linked to this ECR
 *   GET    /notices                   list all ECNs (filter by contextId)
 *   POST   /notices/{noticeId}/release OPEN → RELEASED
 */
@RestController
@RequestMapping("/api/v1/plm/changes")
@RequiredArgsConstructor
public class ChangeRequestController {

    private final IChangeRequestService changeService;

    // ── mappers ────────────────────────────────────────────────────────────────

    private ChangeRequestDto toDto(ChangeRequest cr) {
        ChangeRequestDto dto = new ChangeRequestDto();
        dto.setId(cr.getId());
        dto.setChangeNumber(cr.getChangeNumber());
        dto.setContextId(cr.getContextId());
        dto.setTitle(cr.getTitle());
        dto.setDescription(cr.getDescription());
        dto.setReason(cr.getReason());
        dto.setPriority(cr.getPriority());
        dto.setStatus(cr.getStatus());
        dto.setCreatedBy(cr.getCreatedBy());
        dto.setCreatedAt(cr.getCreatedAt());
        dto.setSubmittedBy(cr.getSubmittedBy());
        dto.setSubmittedAt(cr.getSubmittedAt());
        dto.setReviewedBy(cr.getReviewedBy());
        dto.setReviewedAt(cr.getReviewedAt());
        dto.setResolutionComment(cr.getResolutionComment());
        dto.setClosedBy(cr.getClosedBy());
        dto.setClosedAt(cr.getClosedAt());
        dto.setChangeNoticeId(cr.getChangeNoticeId());
        // decode comma-separated part IDs
        String raw = cr.getImpactedPartIds();
        if (raw != null && !raw.isBlank()) {
            dto.setImpactedPartIds(
                Arrays.stream(raw.split(","))
                      .map(String::trim)
                      .filter(s -> !s.isEmpty())
                      .map(Long::parseLong)
                      .collect(Collectors.toList())
            );
        } else {
            dto.setImpactedPartIds(List.of());
        }
        return dto;
    }

    private ChangeRequestSummaryDto toSummary(ChangeRequest cr) {
        ChangeRequestSummaryDto dto = new ChangeRequestSummaryDto();
        dto.setId(cr.getId());
        dto.setChangeNumber(cr.getChangeNumber());
        dto.setTitle(cr.getTitle());
        dto.setPriority(cr.getPriority());
        dto.setStatus(cr.getStatus());
        dto.setCreatedBy(cr.getCreatedBy());
        dto.setCreatedAt(cr.getCreatedAt());
        String raw = cr.getImpactedPartIds();
        dto.setImpactedPartCount(
            (raw == null || raw.isBlank()) ? 0 :
            (int) Arrays.stream(raw.split(",")).filter(s -> !s.trim().isEmpty()).count()
        );
        return dto;
    }

    private ChangeNoticeDto toNoticeDto(ChangeNotice cn, String crNumber) {
        ChangeNoticeDto dto = new ChangeNoticeDto();
        dto.setId(cn.getId());
        dto.setNoticeNumber(cn.getNoticeNumber());
        dto.setContextId(cn.getContextId());
        dto.setChangeRequestId(cn.getChangeRequestId());
        dto.setChangeRequestNumber(crNumber);
        dto.setTitle(cn.getTitle());
        dto.setSummary(cn.getSummary());
        dto.setStatus(cn.getStatus());
        dto.setCreatedBy(cn.getCreatedBy());
        dto.setCreatedAt(cn.getCreatedAt());
        dto.setReleasedBy(cn.getReleasedBy());
        dto.setReleasedAt(cn.getReleasedAt());
        return dto;
    }

    // ── endpoints ──────────────────────────────────────────────────────────────

    /** POST /api/v1/plm/changes */
    @PostMapping
    public ResponseEntity<ApiResponse<ChangeRequestDto>> create(
            @Valid @RequestBody CreateChangeRequestRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        ChangeRequest cr = changeService.create(
            req.getContextId(), req.getTitle(), req.getDescription(),
            req.getReason(), req.getPriority(),
            req.getImpactedPartIds(), principal.getUsername()
        );
        return ResponseEntity.ok(ApiResponse.success(toDto(cr)));
    }

    /** GET /api/v1/plm/changes?contextId=&status= */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChangeRequestSummaryDto>>> list(
            @RequestParam(required = false) Long contextId,
            @RequestParam(required = false) String status) {
        List<ChangeRequest> results;
        if (contextId != null && status != null) {
            results = changeService.listByContextAndStatus(
                contextId, ChangeRequestStatus.valueOf(status.toUpperCase()));
        } else if (contextId != null) {
            results = changeService.listByContext(contextId);
        } else if (status != null) {
            results = changeService.listByStatus(
                ChangeRequestStatus.valueOf(status.toUpperCase()));
        } else {
            results = changeService.listByStatus(ChangeRequestStatus.SUBMITTED);
        }
        List<ChangeRequestSummaryDto> dtos = results.stream()
            .map(this::toSummary).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** GET /api/v1/plm/changes/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(toDto(changeService.getById(id))));
    }

    /** POST /api/v1/plm/changes/{id}/submit */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
            toDto(changeService.submit(id, principal.getUsername()))));
    }

    /** POST /api/v1/plm/changes/{id}/start-review */
    @PostMapping("/{id}/start-review")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> startReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
            toDto(changeService.startReview(id, principal.getUsername()))));
    }

    /** POST /api/v1/plm/changes/{id}/approve */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewChangeRequestRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        String comment = req != null ? req.getComment() : null;
        return ResponseEntity.ok(ApiResponse.success(
            toDto(changeService.approve(id, principal.getUsername(), comment))));
    }

    /** POST /api/v1/plm/changes/{id}/reject */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewChangeRequestRequest req,
            @AuthenticationPrincipal UserDetails principal) {
        String comment = req != null ? req.getComment() : "";
        return ResponseEntity.ok(ApiResponse.success(
            toDto(changeService.reject(id, principal.getUsername(), comment))));
    }

    /** POST /api/v1/plm/changes/{id}/close */
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> close(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
            toDto(changeService.close(id, principal.getUsername()))));
    }

    /** POST /api/v1/plm/changes/{id}/reopen */
    @PostMapping("/{id}/reopen")
    public ResponseEntity<ApiResponse<ChangeRequestDto>> reopen(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.success(
            toDto(changeService.reopen(id, principal.getUsername()))));
    }

    /** GET /api/v1/plm/changes/{id}/order-items */
    @GetMapping("/{id}/order-items")
    public ResponseEntity<ApiResponse<List<ChangeOrderItem>>> getOrderItems(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(changeService.getOrderItems(id)));
    }

    /** GET /api/v1/plm/changes/{id}/notice */
    @GetMapping("/{id}/notice")
    public ResponseEntity<ApiResponse<ChangeNoticeDto>> getNotice(@PathVariable Long id) {
        ChangeRequest cr = changeService.getById(id);
        ChangeNotice notice = changeService.getNoticeByChangeRequest(id);
        if (notice == null) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(toNoticeDto(notice, cr.getChangeNumber())));
    }

    /** GET /api/v1/plm/changes/notices?contextId= */
    @GetMapping("/notices")
    public ResponseEntity<ApiResponse<List<ChangeNoticeDto>>> listNotices(
            @RequestParam(required = false) Long contextId) {
        List<ChangeNotice> notices = contextId != null
            ? changeService.listNoticesByContext(contextId)
            : List.of();
        List<ChangeNoticeDto> dtos = notices.stream()
            .map(n -> {
                try {
                    ChangeRequest cr = changeService.getById(n.getChangeRequestId());
                    return toNoticeDto(n, cr.getChangeNumber());
                } catch (Exception e) {
                    return toNoticeDto(n, "");
                }
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    /** POST /api/v1/plm/changes/notices/{noticeId}/release */
    @PostMapping("/notices/{noticeId}/release")
    public ResponseEntity<ApiResponse<ChangeNoticeDto>> releaseNotice(
            @PathVariable Long noticeId,
            @AuthenticationPrincipal UserDetails principal) {
        ChangeNotice released = changeService.releaseNotice(noticeId, principal.getUsername());
        ChangeRequest cr = changeService.getById(released.getChangeRequestId());
        return ResponseEntity.ok(ApiResponse.success(
            toNoticeDto(released, cr.getChangeNumber())));
    }
}
