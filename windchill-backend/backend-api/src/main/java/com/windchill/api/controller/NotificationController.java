package com.windchill.api.controller;

import com.windchill.api.security.AuthenticatedUser;
import com.windchill.domain.entity.Notification;
import com.windchill.service.notification.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for in-app notifications.
 *
 * All endpoints are authenticated (anyRequest().authenticated() in SecurityConfig).
 * Response shape matches the { success, message, data } pattern used across this API
 * so the frontend api util's res.data.data unwrapping works correctly.
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final INotificationService notificationService;

    /** GET /api/v1/notifications/count  → { success, data: { unreadCount: N } } */
    @GetMapping("/count")
    public ResponseEntity<?> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        long count = notificationService.getUnreadCountForUser(principal.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Unread count fetched",
                "data", Map.of("unreadCount", count)
        ));
    }

    /** GET /api/v1/notifications/unread → { success, data: [ ...notifications ] } */
    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadNotifications(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<Notification> notifications =
                notificationService.getUnreadNotificationsForUser(principal.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Unread notifications fetched",
                "data", notifications
        ));
    }

    /** GET /api/v1/notifications  → { success, data: [ ...all notifications ] } */
    @GetMapping
    public ResponseEntity<?> getAllNotifications(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        List<Notification> notifications =
                notificationService.getNotificationsForUser(principal.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notifications fetched",
                "data", notifications
        ));
    }

    /** PUT /api/v1/notifications/{id}/read */
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        boolean success = notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.ok(Map.of(
                "success", success,
                "message", success ? "Marked as read" : "Notification not found"
        ));
    }

    /** PUT /api/v1/notifications/read-all */
    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        int count = notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", count + " notification(s) marked as read",
                "data", Map.of("count", count)
        ));
    }

    /** DELETE /api/v1/notifications/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.deleteNotification(id, principal.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notification deleted"
        ));
    }
}
