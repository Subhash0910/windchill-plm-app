package com.windchill.api.security;

import com.windchill.common.enums.RoleEnum;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = getTokenFromRequest(request);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserIdFromJWT(token);
                String username = jwtTokenProvider.getUsernameFromToken(token);
                RoleEnum role = jwtTokenProvider.getRoleFromToken(token);

                AuthenticatedUser principal = new AuthenticatedUser(userId, username, role);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                principal,
                                null,
                                role != null
                                        ? Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role.name()))
                                        : Collections.emptyList()
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (Exception e) {
            // OncePerRequestFilter uses commons-logging; use the (message, Throwable) overload.
            logger.error("Cannot set user authentication: " + e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
