package com.windchill.api.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WTDocumentCreateRequest {
    @NotNull
    private Long   contextId;
    private Long   folderId;
    private String docNumber;
    @NotBlank @Size(max = 255)
    private String name;
    @Size(max = 4000)
    private String description;
    /** SPEC | DRAWING | PROCEDURE | REPORT  (default SPEC) */
    private String docType = "SPEC";
}
