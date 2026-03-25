package com.windchill.api.document;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WTDocumentUpdateRequest {
    private String name;
    private String description;
    private String docType;
}
