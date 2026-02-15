package com.windchill.api.dto;

import com.windchill.common.enums.RoleEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContextMemberCreateRequest {

    /**
     * Username or email.
     */
    @NotBlank
    private String user;

    @NotNull
    private RoleEnum role;
}
