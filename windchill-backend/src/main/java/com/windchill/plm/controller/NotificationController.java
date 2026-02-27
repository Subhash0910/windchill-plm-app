package com.windchill.plm.controller;

import com.windchill.plm.model.Notification;
import com.windchill.plm.model.User;
import com.windchill.plm.service.NotificationService;
import com.windchill.plm.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for notification management.
 * 
 * @author Subhash
 * @version 2.0
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Notifications", description = "Notification management API")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    /**
     * Get all notifications for current user (paginated)
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user notifications", description = "Get all notifications for the authenticated user")
    public ResponseEntity<Page<Notification>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        Pageable pageable = PageRequest.of(page, size);
        
        Page<Notification> notifications = notificationService.getUserNotifications(
                currentUser.getId(), 
                pageable
        );
        
        log.info("🔔 Retrieved {} notifications for user {}", notifications.getTotalElements(), currentUser.getId());
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for current user
     */
    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread notifications", description = "Get all unread notifications for the authenticated user")
    public ResponseEntity<List<Notification>> getUnreadNotifications(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<Notification> notifications = notificationService.getUnreadNotifications(currentUser.getId());
        
        log.info("🔔 Retrieved {} unread notifications for user {}", notifications.size(), currentUser.getId());
        
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notification count
     */
    @GetMapping("/count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread count", description = "Get count of unread notifications")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        long count = notificationService.getUnreadCount(currentUser.getId());
        
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * Mark notification as read
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark as read", description = "Mark a notification as read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // TODO: Verify notification belongs to current user
        notificationService.markAsRead(id);
        
        log.info("✅ Notification {} marked as read by user {}", id, currentUser.getId());
        
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    /**
     * Mark all notifications as read
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all as read", description = "Mark all notifications as read for the authenticated user")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        notificationService.markAllAsRead(currentUser.getId());
        
        log.info("✅ All notifications marked as read for user {}", currentUser.getId());
        
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    /**
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete notification", description = "Delete a notification")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {
        
        User currentUser = userService.getUserByUsername(authentication.getName());
        
        // TODO: Verify notification belongs to current user
        notificationService.deleteNotification(id);
        
        log.info("🗑️ Notification {} deleted by user {}", id, currentUser.getId());
        
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}
