package com.windchill.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Additional CORS filter to ensure all preflight requests are handled correctly.
 * This acts as a catch-all for OPTIONS requests before they reach Spring Security.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter extends OncePerRequestFilter {

    // Dev-safe allowed origins. Keep this explicit when credentials are enabled.
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "http://localhost",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:80",
            "http://127.0.0.1",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://frontend",
            "http://windchill-frontend"
    );

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String origin = request.getHeader("Origin");
        boolean originAllowed = origin != null && ALLOWED_ORIGINS.contains(origin);

        // IMPORTANT:
        // If the browser sends credentials (cookies / Authorization + withCredentials),
        // we must NOT use wildcard "*" for Allow-Origin. We must echo an allowed origin.
        if (originAllowed) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Vary", "Origin");
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }

        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");

        String reqHeaders = request.getHeader("Access-Control-Request-Headers");
        if (reqHeaders != null && !reqHeaders.isBlank()) {
            response.setHeader("Access-Control-Allow-Headers", reqHeaders);
        } else {
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
        }

        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Expose-Headers", "Authorization, Content-Type, X-Total-Count");

        // Handle preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
