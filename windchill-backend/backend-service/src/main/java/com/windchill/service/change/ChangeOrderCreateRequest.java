package com.windchill.service.change;

import com.windchill.domain.entity.ChangeOrder;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChangeOrderCreateRequest {
    @NotNull  private Long contextId;
    @NotBlank private String title;
    private String description;
    private ChangeOrder.Priority priority = ChangeOrder.Priority.MEDIUM;
    private Long ecrId;
    private String assignedTo;
    private LocalDate dueDate;
}
