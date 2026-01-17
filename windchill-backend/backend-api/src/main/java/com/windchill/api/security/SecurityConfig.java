package com.windchill.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                // Allow public access to Swagger/OpenAPI docs
                .requestMatchers(
                    "/api/v1/api-docs/**",
                    "/api/v1/swagger-ui/**",
                    "/api/v1/swagger-ui.html",
                    "/api/v1/v3/api-docs/**",
                    "/api/v1/webjars/**"
                ).permitAll()
                // Allow public access to authentication endpoints (to be added later)
                .requestMatchers("/api/v1/auth/**").permitAll()
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .httpBasic(basic -> {});
        
        return http.build();
    }
}
