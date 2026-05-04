package com.windchill.service.change;

import com.windchill.domain.entity.ChangeOrder;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ChangeOrderCreateRequest {
    @NotNull  private Long contextId;
    @NotBlank @Size(max = 255) private String title;
    @Size(max = 4000) private String description;
    private ChangeOrder.Priority priority = ChangeOrder.Priority.MEDIUM;
    private Long ecrId;
    private String assignedTo;
    private LocalDate dueDate;
}
