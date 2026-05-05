package com.windchill.api.document;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder(toBuilder = true)
public class WTDocumentDto {
    private Long          id;
    private Long          contextId;
    private Long          folderId;
    private Long          masterId;
    private String        docNumber;
    private String        name;
    private String        description;
    private String        docType;
    private String        lifecycleState;
    private String        revision;
    private Integer       iteration;
    private Boolean       isLatest;
    private String        checkedOutBy;
    private String        fileName;
    private Long          fileSize;
    private String        mimeType;
    private String        versionLabel;
    private String        createdBy;
    private String        updatedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
