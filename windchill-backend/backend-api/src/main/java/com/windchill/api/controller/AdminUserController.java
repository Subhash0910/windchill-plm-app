package com.windchill.api.controller;

import com.windchill.api.dto.CreateUserRequest;
import com.windchill.api.dto.ResetPasswordRequest;
import com.windchill.api.dto.UserStatusUpdateRequest;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.AdminUserView;
import com.windchill.common.dto.ApiResponse;
import com.windchill.common.enums.RoleEnum;
import com.windchill.common.exceptions.BusinessException;
import com.windchill.common.exceptions.ResourceNotFoundException;
import com.windchill.common.security.CurrentUserProvider;
import com.windchill.domain.entity.User;
import com.windchill.repository.UserRepository;
import com.windchill.service.user.IUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Slf4j
public class AdminUserController {

    private final CurrentUserProvider currentUser;
    private final IUserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> listUsers() {
        requireAdmin();
        List<User> users = userRepository.findAllActiveUsers();
        List<AdminUserView> data = users.stream().map(this::toView).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.SUCCESS).data(data).build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> create(@Valid @RequestBody CreateUserRequest request) {
        requireAdmin();
        log.info("[ADMIN] Creating new user: {}", request.getUsername());
        User user = userService.createUser(request.getUsername(), request.getEmail(), request.getPassword(), request.getRole());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.builder().success(true).message(APIConstants.CREATED).data(toView(user)).build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> setActive(@PathVariable Long id, @Valid @RequestBody UserStatusUpdateRequest req) {
        requireAdmin();
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        u.setIsActive(req.getActive());
        User saved = userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.builder().success(true).message(APIConstants.UPDATED).data(toView(saved)).build());
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<ApiResponse<?>> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest req) {
        requireAdmin();
        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        String temp = (req == null || req.getNewPassword() == null || req.getNewPassword().isBlank())
                ? generateTempPassword()
                : req.getNewPassword().trim();

        // Store encoded password. User entity is expected to persist encoded password.
        u.setPassword(passwordEncoder.encode(temp));
        userRepository.save(u);

        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(APIConstants.UPDATED)
                .data(java.util.Map.of("userId", id, "temporaryPassword", temp))
                .build());
    }

    private void requireAdmin() {
        if (currentUser.getRole() != RoleEnum.ADMIN) {
            throw new BusinessException("Access denied: ADMIN only");
        }
    }

    private AdminUserView toView(User u) {
        return AdminUserView.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .role(u.getRole())
                .isActive(u.getIsActive())
                .build();
    }

    private String generateTempPassword() {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 12; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
