package com.windchill.api.controller;

import com.windchill.api.dto.WorkItemDto;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.PromotionRequest;
import com.windchill.domain.entity.WorkItem;
import com.windchill.repository.PromotionRequestRepository;
import com.windchill.service.INotificationService;
import com.windchill.service.plm.IPartService;
import com.windchill.service.workflow.PromotionWorkflowService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/workitems")
@RequiredArgsConstructor
@Slf4j
public class WorkItemController {

    private final PromotionWorkflowService   workflow;
    private final IPartService               partService;
    private final INotificationService       notificationService;
    private final PromotionRequestRepository promotionRequestRepo;

    /* ── GET /my ───────────────────────────────────────────────────────────── */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<?>> my() {
        List<WorkItem>    raw   = workflow.myPendingWorkItems();
        List<WorkItemDto> items = raw.stream()
                .map(w -> toDto(w, resolvePart(w.getPartId())))
                .toList();
        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(items).build());
    }

    /* ── POST /{id}/approve ────────────────────────────────────────────────────── */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<?>> approve(
            @PathVariable Long id,
            @RequestBody(required = false) CommentRequest req) {

        String   comment = req == null ? null : req.getComment();
        WorkItem saved   = workflow.approve(id, comment);
        Part     part    = resolvePart(saved.getPartId());

        // Notify the part submitter that their part was approved
        try {
            PromotionRequest pr = promotionRequestRepo
                    .findById(saved.getPromotionRequestId()).orElse(null);
            if (pr != null && pr.getRequestedByUserId() != null) {
                String pNum  = part != null ? part.getPartNumber() : ("Part #" + saved.getPartId());
                String pName = (part != null && part.getName() != null) ? part.getName() : "";
                String label = pName.isBlank() ? pNum : pNum + " (" + pName + ")";
                // Correct signature: (userId, title, message, type, entityType, entityId, entityNumber)
                notificationService.create(
                        pr.getRequestedByUserId(),
                        "Part approved \u2014 " + pNum,
                        label + " has been reviewed and is now RELEASED.",
                        "PART_PROMOTED",
                        "PART",
                        saved.getPartId(),
                        pNum
                );
                log.info("Approve notification sent to userId={} for {}", pr.getRequestedByUserId(), pNum);
            }
        } catch (Exception ex) {
            log.warn("Approve notification failed (non-critical): {}", ex.getMessage());
        }

        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(toDto(saved, part)).build());
    }

    /* ── POST /{id}/reject ─────────────────────────────────────────────────────── */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<?>> reject(
            @PathVariable Long id,
            @RequestBody(required = false) CommentRequest req) {

        WorkItem saved = workflow.reject(id, req == null ? null : req.getComment());
        Part     part  = resolvePart(saved.getPartId());

        // Notify the part submitter that their part was rejected
        try {
            PromotionRequest pr = promotionRequestRepo
                    .findById(saved.getPromotionRequestId()).orElse(null);
            if (pr != null && pr.getRequestedByUserId() != null) {
                String pNum   = part != null ? part.getPartNumber() : ("Part #" + saved.getPartId());
                String pName  = (part != null && part.getName() != null) ? part.getName() : "";
                String label  = pName.isBlank() ? pNum : pNum + " (" + pName + ")";
                String reason = (req != null && req.getComment() != null && !req.getComment().isBlank())
                        ? req.getComment() : "No reason given";
                // Correct signature: (userId, title, message, type, entityType, entityId, entityNumber)
                notificationService.create(
                        pr.getRequestedByUserId(),
                        "Part rejected \u2014 " + pNum,
                        label + " was rejected. Reason: " + reason,
                        "ECR_REJECTED",
                        "PART",
                        saved.getPartId(),
                        pNum
                );
                log.info("Reject notification sent to userId={} for {}", pr.getRequestedByUserId(), pNum);
            }
        } catch (Exception ex) {
            log.warn("Reject notification failed (non-critical): {}", ex.getMessage());
        }

        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(toDto(saved, part)).build());
    }

    /* ── Helpers ──────────────────────────────────────────────────────────────── */

    /** Safe part lookup – returns null instead of throwing. */
    private Part resolvePart(Long partId) {
        if (partId == null) return null;
        try { return partService.getPart(partId); }
        catch (Exception e) {
            log.debug("resolvePart: could not load part #{}: {}", partId, e.getMessage());
            return null;
        }
    }

    private static WorkItemDto toDto(WorkItem w, Part part) {
        return WorkItemDto.builder()
                .id(w.getId())
                .promotionRequestId(w.getPromotionRequestId())
                .contextId(w.getContextId())
                .partId(w.getPartId())
                .partNumber(part != null ? part.getPartNumber() : null)
                .partName(part  != null ? part.getName()        : null)
                .assigneeUserId(w.getAssigneeUserId())
                .status(w.getStatus())
                .dueAt(w.getDueAt())
                .completedAt(w.getCompletedAt())
                .build();
    }

    @Data
    public static class CommentRequest {
        private String comment;
    }
}
