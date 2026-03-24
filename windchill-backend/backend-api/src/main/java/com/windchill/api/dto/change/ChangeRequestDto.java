package com.windchill.api.dto.change;

import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeRequestStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full ChangeRequest DTO — returned by GET /changes/{id} and list endpoints.
 */
@Data
public class ChangeRequestDto {
    private Long              id;
    private String            changeNumber;
    private Long              contextId;
    private String            title;
    private String            description;
    private String            reason;
    private ChangePriority    priority;
    private ChangeRequestStatus status;
    private String            createdBy;
    private LocalDateTime     createdAt;
    private String            submittedBy;
    private LocalDateTime     submittedAt;
    private String            reviewedBy;
    private LocalDateTime     reviewedAt;
    private String            resolutionComment;
    private String            closedBy;
    private LocalDateTime     closedAt;
    private List<Long>        impactedPartIds;
    private Long              changeNoticeId;
}
