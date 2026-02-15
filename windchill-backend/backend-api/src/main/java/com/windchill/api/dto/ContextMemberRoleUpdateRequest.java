package com.windchill.api.dto;

import com.windchill.common.enums.RoleEnum;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ContextMemberRoleUpdateRequest {
    @NotNull
    private RoleEnum role;
}
