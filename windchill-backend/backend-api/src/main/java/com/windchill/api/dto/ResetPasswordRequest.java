package com.windchill.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    /**
     * Optional. If not provided, server will generate a temporary password.
     */
    private String newPassword;
}
