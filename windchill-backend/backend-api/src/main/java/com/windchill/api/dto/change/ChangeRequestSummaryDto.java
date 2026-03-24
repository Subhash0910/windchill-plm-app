package com.windchill.api.dto.change;

import com.windchill.common.enums.ChangePriority;
import com.windchill.common.enums.ChangeRequestStatus;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Lightweight ChangeRequest DTO — used in list views and dashboard.
 */
@Data
public class ChangeRequestSummaryDto {
    private Long                id;
    private String              changeNumber;
    private String              title;
    private ChangePriority      priority;
    private ChangeRequestStatus status;
    private String              createdBy;
    private LocalDateTime       createdAt;
    private int                 impactedPartCount;
}
