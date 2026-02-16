package com.windchill.api.controller;

import com.windchill.api.dto.WorkItemDto;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.WorkItem;
import com.windchill.service.workflow.PromotionWorkflowService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/plm/workitems")
@RequiredArgsConstructor
public class WorkItemController {

    private final PromotionWorkflowService workflow;

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<?>> my() {
        List<WorkItemDto> items = workflow.myPendingWorkItems().stream().map(WorkItemController::toDto).toList();
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(items).build());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<?>> approve(@PathVariable Long id, @RequestBody(required = false) CommentRequest req) {
        String comment = req == null ? null : req.getComment();
        WorkItem saved = workflow.approve(id, comment);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(toDto(saved)).build());
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<?>> reject(@PathVariable Long id, @RequestBody(required = false) CommentRequest req) {
        WorkItem saved = workflow.reject(id, req == null ? null : req.getComment());
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(toDto(saved)).build());
    }

    private static WorkItemDto toDto(WorkItem w) {
        return new WorkItemDto(
                w.getId(),
                w.getPromotionRequestId(),
                w.getContextId(),
                w.getPartId(),
                w.getAssigneeUserId(),
                w.getStatus(),
                w.getDueAt(),
                w.getCompletedAt()
        );
    }

    @Data
    public static class CommentRequest {
        private String comment;
    }
}
