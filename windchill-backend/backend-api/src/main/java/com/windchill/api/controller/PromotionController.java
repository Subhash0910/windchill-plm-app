package com.windchill.api.controller;

import com.windchill.api.dto.PromotionStatusDto;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.PromotionRequest;
import com.windchill.domain.entity.User;
import com.windchill.domain.entity.WorkItem;
import com.windchill.domain.entity.WorkItemComment;
import com.windchill.repository.UserRepository;
import com.windchill.service.workflow.PromotionWorkflowService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/plm/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionWorkflowService workflow;
    private final UserRepository userRepository;

    @GetMapping("/parts/{partId}/latest")
    public ResponseEntity<ApiResponse<?>> latestForPart(@PathVariable Long partId) {
        PromotionWorkflowService.PromotionSnapshot snap = workflow.getLatestPromotionSnapshotForPart(partId);
        if (snap == null) {
            return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(null).build());
        }

        PromotionRequest pr = snap.getRequest();
        List<WorkItem> items = snap.getWorkItems();
        List<WorkItemComment> comments = snap.getComments();

        Set<Long> userIds = new LinkedHashSet<>();
        if (pr.getRequestedByUserId() != null) userIds.add(pr.getRequestedByUserId());
        if (pr.getCompletedByUserId() != null) userIds.add(pr.getCompletedByUserId());

        for (WorkItem w : items) {
            if (w.getAssigneeUserId() != null) userIds.add(w.getAssigneeUserId());
            if (w.getCompletedByUserId() != null) userIds.add(w.getCompletedByUserId());
        }

        for (WorkItemComment c : comments) {
            if (c.getCommentedByUserId() != null) userIds.add(c.getCommentedByUserId());
        }

        Map<Long, User> usersById = userIds.isEmpty()
                ? Collections.emptyMap()
                : userRepository.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, Function.identity(), (a, b) -> a));

        Function<Long, String> display = (uid) -> {
            if (uid == null) return null;
            User u = usersById.get(uid);
            if (u == null) return "User#" + uid;
            String full = u.getFullName();
            if (full != null && !full.trim().isBlank()) {
                return u.getUsername() + " (" + full.trim() + ")";
            }
            return u.getUsername();
        };

        PromotionStatusDto dto = new PromotionStatusDto(
                new PromotionStatusDto.PromotionRequestView(
                        pr.getId(),
                        pr.getContextId(),
                        pr.getPartId(),
                        pr.getRequestedByUserId(),
                        display.apply(pr.getRequestedByUserId()),
                        pr.getFromState(),
                        pr.getToState(),
                        pr.getStatus(),
                        pr.getCreatedAt(),
                        pr.getCompletedAt(),
                        pr.getCompletedByUserId(),
                        display.apply(pr.getCompletedByUserId())
                ),
                (items == null ? List.<PromotionStatusDto.PromotionWorkItemView>of() : items.stream().map(w -> new PromotionStatusDto.PromotionWorkItemView(
                        w.getId(),
                        w.getAssigneeUserId(),
                        display.apply(w.getAssigneeUserId()),
                        w.getStatus(),
                        w.getDueAt(),
                        w.getCompletedAt(),
                        w.getCompletedByUserId(),
                        display.apply(w.getCompletedByUserId())
                )).toList()),
                (comments == null ? List.<PromotionStatusDto.PromotionCommentView>of() : comments.stream().map(c -> new PromotionStatusDto.PromotionCommentView(
                        c.getId(),
                        c.getWorkItemId(),
                        c.getCommentedByUserId(),
                        display.apply(c.getCommentedByUserId()),
                        c.getComment(),
                        c.getCreatedAt()
                )).toList())
        );

        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(dto).build());
    }

    // ─── POST /{workItemId}/escalate ───────────────────────────────────────────

    @PostMapping("/{workItemId}/escalate")
    public ResponseEntity<ApiResponse<?>> escalate(@PathVariable Long workItemId,
                                                    @RequestBody EscalateRequest req) {
        String reason = req != null && req.getReason() != null ? req.getReason() : "Escalated";
        WorkItem escalated = workflow.escalateWorkItem(workItemId, reason);
        return ResponseEntity.ok(
                ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(escalated).build());
    }

    @Data
    public static class EscalateRequest {
        private String reason;
    }
}
