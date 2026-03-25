package com.windchill.api.document;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WTDocumentCreateRequest {
    private Long   contextId;
    private Long   folderId;
    private String docNumber;
    private String name;
    private String description;
    /** SPEC | DRAWING | PROCEDURE | REPORT  (default SPEC) */
    private String docType = "SPEC";
}
