package com.windchill.api.document;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WTDocumentUpdateRequest {
    @Size(max = 255)
    private String name;
    @Size(max = 4000)
    private String description;
    private String docType;
}
