package com.windchill.common.security;

import com.windchill.common.enums.RoleEnum;

/**
 * Abstraction to access the current authenticated user in service layer.
 * Implemented in backend-api (Spring Security), consumed in backend-service.
 */
public interface CurrentUserProvider {

    Long getUserId();

    String getUsername();

    RoleEnum getRole();

    default boolean isAdmin() {
        return getRole() == RoleEnum.ADMIN;
    }
}
