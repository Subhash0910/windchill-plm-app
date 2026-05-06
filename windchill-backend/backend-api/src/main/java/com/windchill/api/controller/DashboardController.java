package com.windchill.api.controller;

import com.windchill.api.document.WTDocumentRepository;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeRequestStatus;
import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.WorkItemStatusEnum;
import com.windchill.domain.entity.ChangeOrder;
import com.windchill.domain.entity.ChangeRequest;
import com.windchill.domain.entity.Part;
import com.windchill.domain.entity.WorkItem;
import com.windchill.repository.ChangeOrderRepository;
import com.windchill.repository.ChangeRequestRepository;
import com.windchill.repository.PartRepository;
import com.windchill.repository.WorkItemRepository;
import com.windchill.service.plm.security.PlmAclService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Read-only dashboard stats endpoint that powers the KPI cards
 * on the Dashboard page. Queries the database directly for real,
 * context-scoped counts and recent-item lists.
 *
 * GET /api/v1/plm/dashboard/stats?contextId=X
 */
@RestController
@RequestMapping("/api/v1/plm/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final PartRepository             partRepository;
    private final ChangeRequestRepository    changeRequestRepository;
    private final ChangeOrderRepository      changeOrderRepository;
    private final WTDocumentRepository        wtDocumentRepository;
    private final WorkItemRepository         workItemRepository;
    private final PlmAclService              acl;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<?>> stats(@RequestParam Long contextId) {
        log.debug("Dashboard stats requested for contextId={}", contextId);

        // ── Parts by context ─────────────────────────────────────────────────
        List<Part> parts = partRepository.findByContextIdAndIsDeletedFalseOrderByPartNumberAsc(contextId);

        long totalParts   = parts.size();
        long inWork       = countByState(parts, LifecycleStateEnum.INWORK);
        long underReview  = countByState(parts, LifecycleStateEnum.UNDERREVIEW);
        long released     = countByState(parts, LifecycleStateEnum.RELEASED);
        long obsolete     = countByState(parts, LifecycleStateEnum.OBSOLETE);

        // Recent parts — last 5 by id descending
        List<Map<String, Object>> recentParts = parts.stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .limit(5)
                .map(p -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",             p.getId());
                    m.put("partNumber",     p.getPartNumber());
                    m.put("name",           p.getName());
                    m.put("lifecycleState", p.getLifecycleState().name());
                    return m;
                })
                .collect(Collectors.toList());

        // ── Documents in context ─────────────────────────────────────────────
        long totalDocuments = wtDocumentRepository
                .findByContextIdAndIsLatestTrueAndIsDeletedFalse(contextId).size();

        // ── ECRs in context ──────────────────────────────────────────────────
        List<ChangeRequest> ecrs = changeRequestRepository
                .findByContextIdOrderByCreatedAtDesc(contextId);

        long openEcrs = ecrs.stream()
                .filter(cr -> cr.getStatus() != ChangeRequestStatus.CLOSED
                           && cr.getStatus() != ChangeRequestStatus.REJECTED)
                .count();
        long submittedEcrs = ecrs.stream()
                .filter(cr -> cr.getStatus() == ChangeRequestStatus.SUBMITTED)
                .count();
        long inReviewEcrs = ecrs.stream()
                .filter(cr -> cr.getStatus() == ChangeRequestStatus.IN_REVIEW)
                .count();

        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
        long approvedThisWeek = ecrs.stream()
                .filter(cr -> cr.getStatus() == ChangeRequestStatus.APPROVED
                           && cr.getReviewedAt() != null
                           && cr.getReviewedAt().isAfter(oneWeekAgo))
                .count();

        long criticalOpen = ecrs.stream()
                .filter(cr -> cr.getPriority() == ChangePriority.CRITICAL
                           && cr.getStatus() != ChangeRequestStatus.CLOSED
                           && cr.getStatus() != ChangeRequestStatus.REJECTED)
                .count();

        // Recent ECRs — last 5 by id descending
        List<Map<String, Object>> recentEcrs = ecrs.stream()
                .limit(5)
                .map(cr -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",           cr.getId());
                    m.put("changeNumber", cr.getChangeNumber());
                    m.put("title",        cr.getTitle());
                    m.put("status",       cr.getStatus().name());
                    m.put("priority",     cr.getPriority().name());
                    return m;
                })
                .collect(Collectors.toList());

        // ── Open ECOs in context ─────────────────────────────────────────────
        List<ChangeOrder> ecos = changeOrderRepository
                .findByContextIdAndIsDeletedFalseOrderByCreatedAtDesc(contextId);

        long openEcos = ecos.stream()
                .filter(co -> co.getState() != ChangeOrder.State.COMPLETED
                           && co.getState() != ChangeOrder.State.CANCELLED)
                .count();

        // ── Pending work items for current user ──────────────────────────────
        long pendingWorkItems = 0;
        try {
            Long userId = acl.requireUserId();
            List<WorkItem> pendingItems = workItemRepository
                    .findByAssigneeUserIdAndStatusAndIsDeletedFalseOrderByDueAtAsc(
                            userId, WorkItemStatusEnum.PENDING);
            pendingWorkItems = pendingItems.size();
        } catch (Exception ex) {
            log.debug("Could not fetch pending work items for dashboard: {}", ex.getMessage());
        }

        // ── Build response ───────────────────────────────────────────────────
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalParts",       totalParts);
        data.put("inWork",           inWork);
        data.put("underReview",      underReview);
        data.put("released",         released);
        data.put("obsolete",         obsolete);
        data.put("totalDocuments",   totalDocuments);
        data.put("openEcrs",         openEcrs);
        data.put("openEcos",         openEcos);
        data.put("submittedEcrs",    submittedEcrs);
        data.put("inReviewEcrs",     inReviewEcrs);
        data.put("approvedThisWeek", approvedThisWeek);
        data.put("criticalOpen",     criticalOpen);
        data.put("pendingWorkItems", pendingWorkItems);
        data.put("recentParts",      recentParts);
        data.put("recentEcrs",       recentEcrs);

        return ResponseEntity.ok(
                ApiResponse.builder()
                        .success(true)
                        .message(APIConstants.SUCCESS)
                        .data(data)
                        .build());
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    private static long countByState(List<Part> parts, LifecycleStateEnum state) {
        return parts.stream()
                .filter(p -> p.getLifecycleState() == state)
                .count();
    }
}
