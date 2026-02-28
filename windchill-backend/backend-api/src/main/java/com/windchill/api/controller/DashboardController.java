package com.windchill.api.controller;

import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.WorkItem;
import com.windchill.service.plm.IPartService;
import com.windchill.service.workflow.PromotionWorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight read-only stats endpoint that powers the KPI cards
 * on the Dashboard page.
 *
 * GET /api/v1/plm/dashboard/stats?contextId=X
 */
@RestController
@RequestMapping("/api/v1/plm/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final IPartService             partService;
    private final PromotionWorkflowService promotionWorkflow;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<?>> stats(@RequestParam Long contextId) {
        log.debug("Dashboard stats requested for contextId={}", contextId);

        // ── Part counts by lifecycle state ─────────────────────────────────
        List<Part> parts = partService.listParts(contextId);

        long totalParts   = parts.size();
        long inwork       = countByState(parts, "INWORK");
        long underReview  = countByState(parts, "UNDERREVIEW");
        long released     = countByState(parts, "RELEASED");
        long obsolete     = countByState(parts, "OBSOLETE");

        // ── Pending work items for current user ───────────────────────────
        long pendingWorkItems = 0;
        try {
            List<WorkItem> workItems = promotionWorkflow.myPendingWorkItems();
            pendingWorkItems = workItems == null ? 0 :
                    workItems.stream()
                             .filter(w -> w.getStatus() != null
                                     && "PENDING".equals(w.getStatus().name()))
                             .count();
        } catch (Exception ex) {
            log.debug("Could not fetch pending work items for dashboard: {}", ex.getMessage());
        }

        // ── Build response map ────────────────────────────────────────────
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalParts",       totalParts);
        data.put("inwork",           inwork);
        data.put("underReview",      underReview);
        data.put("released",         released);
        data.put("obsolete",         obsolete);
        data.put("pendingWorkItems", pendingWorkItems);

        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(data).build());
    }

    // ── helper ─────────────────────────────────────────────────────────
    private static long countByState(List<Part> parts, String state) {
        return parts.stream()
                .filter(p -> p.getLifecycleState() != null
                        && state.equalsIgnoreCase(p.getLifecycleState().toString()))
                .count();
    }
}
