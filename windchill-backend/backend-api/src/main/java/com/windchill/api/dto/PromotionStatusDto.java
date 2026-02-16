package com.windchill.api.dto;

import com.windchill.common.enums.LifecycleStateEnum;
import com.windchill.common.enums.PromotionRequestStatusEnum;
import com.windchill.common.enums.WorkItemStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class PromotionStatusDto {

    private PromotionRequestView request;
    private List<PromotionWorkItemView> workItems;
    private List<PromotionCommentView> comments;

    @Data
    @AllArgsConstructor
    public static class PromotionRequestView {
        private Long id;
        private Long contextId;
        private Long partId;
        private Long requestedByUserId;
        private String requestedBy;
        private LifecycleStateEnum fromState;
        private LifecycleStateEnum toState;
        private PromotionRequestStatusEnum status;
        private LocalDateTime createdAt;
        private LocalDateTime completedAt;
        private Long completedByUserId;
        private String completedBy;
    }

    @Data
    @AllArgsConstructor
    public static class PromotionWorkItemView {
        private Long id;
        private Long assigneeUserId;
        private String assignee;
        private WorkItemStatusEnum status;
        private LocalDateTime dueAt;
        private LocalDateTime completedAt;
        private Long completedByUserId;
        private String completedBy;
    }

    @Data
    @AllArgsConstructor
    public static class PromotionCommentView {
        private Long id;
        private Long workItemId;
        private Long commentedByUserId;
        private String commentedBy;
        private String comment;
        private LocalDateTime createdAt;
    }
}
