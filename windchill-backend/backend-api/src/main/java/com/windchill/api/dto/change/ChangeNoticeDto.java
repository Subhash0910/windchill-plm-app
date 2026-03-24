package com.windchill.api.dto.change;

import com.windchill.common.enums.ChangeNoticeStatus;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * ChangeNotice (ECN) DTO.
 */
@Data
public class ChangeNoticeDto {
    private Long               id;
    private String             noticeNumber;
    private Long               contextId;
    private Long               changeRequestId;
    private String             changeRequestNumber;
    private String             title;
    private String             summary;
    private ChangeNoticeStatus status;
    private String             createdBy;
    private LocalDateTime      createdAt;
    private String             releasedBy;
    private LocalDateTime      releasedAt;
}
