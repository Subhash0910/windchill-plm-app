package com.windchill.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO returned by WorkItemController for /api/v1/plm/workitems/my
 * and approve / reject responses.
 *
 * partNumber + partName are resolved at query time from the Part entity
 * so the Worklist UI can display a meaningful label (e.g. "P001") instead
 * of the raw DB surrogate key.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkItemDto {
    private Long          id;
    private Long          promotionRequestId;
    private Long          contextId;

    // Part identity
    private Long          partId;
    private String        partNumber;   // e.g. "P001"  - null when part cannot be resolved
    private String        partName;     // e.g. "pmfg1" - null when part cannot be resolved

    private Long          assigneeUserId;
    private String        status;       // PENDING | APPROVED | REJECTED
    private LocalDateTime dueAt;
    private LocalDateTime completedAt;
}
