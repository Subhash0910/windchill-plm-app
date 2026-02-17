package com.windchill.api.security;

import com.windchill.common.enums.RoleEnum;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.security.Principal;

@Data
@AllArgsConstructor
public class AuthenticatedUser implements Principal {
    private Long id;
    private String username;
    private RoleEnum role;

    @Override
    public String getName() {
        return username;
    }
}
