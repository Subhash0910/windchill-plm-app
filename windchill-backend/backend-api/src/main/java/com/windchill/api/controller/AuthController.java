package com.windchill.api.controller;

import com.windchill.api.dto.LoginRequest;
import com.windchill.api.dto.LoginResponse;
import com.windchill.api.exception.ValidationException;
import com.windchill.api.security.JwtTokenProvider;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.User;
import com.windchill.service.user.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping(APIConstants.API_AUTH)
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final IUserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());
        
        try {
            User user = userService.authenticateUser(request.getUsername(), request.getPassword());
            if (user == null) {
                throw new ValidationException("Invalid username or password");
            }
            
            userService.updateLastLogin(user.getId());

            String token = jwtTokenProvider.generateToken(user);
            long expiresIn = jwtTokenProvider.getExpirationTime();

            LoginResponse response = LoginResponse.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .role(user.getRole())
                    .token(token)
                    .expiresIn(expiresIn)
                    .build();

            log.info("User logged in successfully: {}", user.getUsername());
            return ResponseEntity.ok(new ApiResponse<>("Login successful", response, true));
        } catch (ValidationException e) {
            log.warn("Login failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Login error: {}", e.getMessage(), e);
            throw new ValidationException("Login failed: " + e.getMessage());
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<ApiResponse<?>> validateToken(@RequestHeader(APIConstants.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith(APIConstants.BEARER)) {
            return ResponseEntity.ok(new ApiResponse<>("Invalid token", false, false));
        }

        String token = authHeader.substring(APIConstants.BEARER.length());
        boolean isValid = jwtTokenProvider.validateToken(token);
        return ResponseEntity.ok(new ApiResponse<>("Token validation result", isValid, true));
    }
}
