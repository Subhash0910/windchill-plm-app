package com.windchill.api.dto;

import com.windchill.common.enums.StatusEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {
    @NotBlank(message = "Product code is required")
    @Size(max = 50, message = "Product code must not exceed 50 characters")
    private String productCode;

    @NotBlank(message = "Product name is required")
    @Size(min = 3, max = 255, message = "Product name must be between 3 and 255 characters")
    private String productName;

    private String description;

    private String category;

    private String manufacturer;

    @DecimalMin(value = "0.0", inclusive = false, message = "Cost must be greater than 0")
    private BigDecimal cost;

    @DecimalMin(value = "0.0", inclusive = false, message = "Selling price must be greater than 0")
    private BigDecimal sellingPrice;

    private String unitOfMeasure = "EA";

    @Min(value = 0, message = "Quantity on hand must be non-negative")
    private Integer quantityOnHand = 0;

    @Min(value = 0, message = "Reorder level must be non-negative")
    private Integer reorderLevel = 10;
}
