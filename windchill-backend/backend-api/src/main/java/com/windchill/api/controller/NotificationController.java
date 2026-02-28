package com.windchill.api.controller;

import com.windchill.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Notification endpoints.
 * The /count endpoint was missing, causing a 404 log-spam on every page load
 * because the frontend polls it immediately after login.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    /**
     * Returns the unread notification count for the currently authenticated user.
     * Returns 0 until a full notification system is implemented.
     */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<?>> getNotificationCount() {
        log.debug("Fetching notification count");
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message("Notification count fetched successfully")
                .data(Map.of("count", 0))
                .build());
    }
}
