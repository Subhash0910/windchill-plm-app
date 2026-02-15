package com.windchill.api.security;

import com.windchill.common.enums.RoleEnum;
import com.windchill.common.security.CurrentUserProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserProviderImpl implements CurrentUserProvider {

    @Override
    public Long getUserId() {
        AuthenticatedUser u = get();
        return u != null ? u.getId() : null;
    }

    @Override
    public String getUsername() {
        AuthenticatedUser u = get();
        return u != null ? u.getUsername() : null;
    }

    @Override
    public RoleEnum getRole() {
        AuthenticatedUser u = get();
        return u != null ? u.getRole() : null;
    }

    private AuthenticatedUser get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof AuthenticatedUser) {
            return (AuthenticatedUser) principal;
        }
        return null;
    }
}
