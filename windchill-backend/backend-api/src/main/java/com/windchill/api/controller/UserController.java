package com.windchill.api.controller;

import com.windchill.api.dto.CreateUserRequest;
import com.windchill.common.constants.APIConstants;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.User;
import com.windchill.service.user.IUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping(APIConstants.API_USERS)
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final IUserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("Creating new user: {}", request.getUsername());
        User user = userService.createUser(request.getUsername(), request.getEmail(), 
                request.getPassword(), request.getRole());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(APIConstants.CREATED, user, true));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getUserById(@PathVariable Long id) {
        log.info("Fetching user by id: {}", id);
        User user = userService.getUserById(id);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, user, true));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllUsers() {
        log.info("Fetching all users");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.SUCCESS, users, true));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        log.info("Updating user: {}", id);
        User updatedUser = userService.updateUser(id, userDetails);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.UPDATED, updatedUser, true));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteUser(@PathVariable Long id) {
        log.info("Deleting user: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.ok(new ApiResponse<>(APIConstants.DELETED, null, true));
    }
}
