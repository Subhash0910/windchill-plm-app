package com.windchill.common.dto;

import com.windchill.common.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserView {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private RoleEnum role;
    private Boolean isActive;
}
