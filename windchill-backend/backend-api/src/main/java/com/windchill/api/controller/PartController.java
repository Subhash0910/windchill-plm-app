package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.WorkItem;
import com.windchill.service.INotificationService;
import com.windchill.service.plm.IPartService;
import com.windchill.service.workflow.PromotionWorkflowService;
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

    private final IPartService             partService;
    private final PromotionWorkflowService promotionWorkflow;
    private final INotificationService     notificationService;

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

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<?>> search(@RequestParam String query) {
        log.info("🔍 Search request for parts matching: {}", query);
        List<Part> parts = partService.searchPartsByNumber(query);
        log.info("✅ Found {} parts matching '{}'", parts.size(), query);
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true).message(APIConstants.SUCCESS).data(parts).build());
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

    /* ───────────────────────────────────────────────────────────────────────
     * POST /{id}/promote
     *
     * Transitions part lifecycle state and fires a WORKLIST_ASSIGNED
     * notification to every work-item assignee so the bell rings for
     * approvers the moment a part needs their review.
     * ─────────────────────────────────────────────────────────────────────── */
    @PostMapping("/{id}/promote")
    public ResponseEntity<ApiResponse<?>> promote(
            @PathVariable Long id,
            @RequestParam LifecycleStateEnum target) {

        Part updated = partService.promote(id, target);

        // Notify every work-item assignee that this part needs their review
        try {
            PromotionWorkflowService.PromotionSnapshot snap =
                    promotionWorkflow.getLatestPromotionSnapshotForPart(updated.getId());
            if (snap != null && snap.getWorkItems() != null && !snap.getWorkItems().isEmpty()) {
                String pNum  = updated.getPartNumber();
                String pName = updated.getName() != null ? updated.getName() : "";
                String label = pName.isBlank() ? pNum : pNum + " (" + pName + ")";

                for (WorkItem wi : snap.getWorkItems()) {
                    if (wi.getAssigneeUserId() != null) {
                        // Correct signature: (userId, title, message, type, entityType, entityId, entityNumber)
                        notificationService.create(
                                wi.getAssigneeUserId(),
                                "Part awaiting review: " + pNum,
                                label + " has been submitted for " + target.name() + " and needs your review.",
                                "WORKLIST_ASSIGNED",
                                "WORK_ITEM",
                                wi.getId(),
                                pNum
                        );
                    }
                }
                log.info("Promote notifications sent for {} to {} assignees",
                        updated.getPartNumber(), snap.getWorkItems().size());
            }
        } catch (Exception ex) {
            log.warn("Promote notification failed (non-critical): {}", ex.getMessage());
        }

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
