package com.windchill.api.security;

import com.windchill.common.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthenticatedUser {
    private Long id;
    private String username;
    private RoleEnum role;
}
