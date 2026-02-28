package com.windchill.api.dto;

import com.windchill.common.enums.WorkItemStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class WorkItemDto {

    private Long id;

    private Long promotionRequestId;

    private Long contextId;

    private Long partId;

    private Long assigneeUserId;

    private WorkItemStatusEnum status;

    private LocalDateTime dueAt;

    private LocalDateTime completedAt;
}
