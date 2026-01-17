package com.windchill.api.dto;

import com.windchill.common.enums.StatusEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {
    @NotBlank(message = "Project code is required")
    @Size(max = 50, message = "Project code must not exceed 50 characters")
    private String projectCode;

    @NotBlank(message = "Project name is required")
    @Size(min = 3, max = 255, message = "Project name must be between 3 and 255 characters")
    private String projectName;

    private String description;

    @NotNull(message = "Manager ID is required")
    private Long managerId;

    private LocalDate startDate;

    private LocalDate endDate;

    @DecimalMin(value = "0.0", message = "Budget must be non-negative")
    private BigDecimal budget;

    private String department;

    private String priority = "MEDIUM";

    @Min(value = 0, message = "Progress percentage must be between 0 and 100")
    @Max(value = 100, message = "Progress percentage must be between 0 and 100")
    private Integer progressPercentage = 0;

    private Boolean isConfidential = false;
}
