package com.windchill.api.controller;

import com.windchill.api.security.AuthenticatedUser;
import com.windchill.common.dto.ApiResponse;
import com.windchill.domain.entity.Notification;
import com.windchill.service.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Full notification CRUD controller.
 * All endpoints require a valid JWT — secured via SecurityConfig anyRequest().authenticated().
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final INotificationService notificationService;

    /** Returns {unreadCount: N} — polled every 30 s by NotificationBell */
    @GetMapping("/count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        long count = notificationService.getUnreadCount(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    /** Returns list of unread notifications for the authenticated user */
    @GetMapping("/unread")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnread(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<Notification> list = notificationService.getUnread(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /** Returns ALL notifications (read + unread) */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getAll(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<Notification> list = notificationService.getAll(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /** Mark a single notification as read */
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Mark ALL notifications for the user as read */
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** Delete a notification */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.delete(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
