package com.windchill.api.change;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChangeOrderCreateRequest {
    @NotNull  private Long contextId;
    @NotBlank private String title;
    private String description;
    private String priority = "MEDIUM";
    private Long ecrId;
    private String assignedTo;
    private LocalDate dueDate;
}
