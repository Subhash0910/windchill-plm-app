package com.tcs.windchill.notification.controller;

import com.tcs.windchill.notification.model.Notification;
import com.tcs.windchill.notification.service.NotificationService;
import com.tcs.windchill.security.CurrentUser;
import com.tcs.windchill.user.model.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API for notifications
 * 
 * Provides endpoints for:
 * - Listing notifications
 * - Marking as read/unread
 * - Getting unread count
 * - Deleting notifications
 * 
 * @author Subhash
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management API")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get user's notifications (paginated)
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get user notifications", description = "Retrieve paginated list of user's notifications")
    public ResponseEntity<Page<NotificationDTO>> getNotifications(
            @CurrentUser User user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<Notification> notifications = notificationService.getUserNotifications(user.getId(), pageable);
        Page<NotificationDTO> dtos = notifications.map(NotificationDTO::fromEntity);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get unread notifications
     */
    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread notifications", description = "Retrieve only unread notifications")
    public ResponseEntity<Page<NotificationDTO>> getUnreadNotifications(
            @CurrentUser User user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        Page<Notification> notifications = notificationService.getUnreadNotifications(user.getId(), pageable);
        Page<NotificationDTO> dtos = notifications.map(NotificationDTO::fromEntity);
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get unread count (for badge)
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get unread count", description = "Get count of unread notifications for badge display")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@CurrentUser User user) {
        Long count = notificationService.getUnreadCount(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Mark notification as read
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark as read", description = "Mark a specific notification as read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            @CurrentUser User user
    ) {
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    /**
     * Mark all notifications as read
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mark all as read", description = "Mark all user notifications as read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@CurrentUser User user) {
        int count = notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of(
            "message", "All notifications marked as read",
            "count", count
        ));
    }

    /**
     * Delete notification
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete notification", description = "Delete a specific notification")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable Long id,
            @CurrentUser User user
    ) {
        notificationService.deleteNotification(id, user.getId());
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}

/**
 * Notification DTO for API responses
 */
@lombok.Data
@lombok.Builder
class NotificationDTO {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String actionUrl;
    private String priority;
    private Boolean isRead;
    private String createdAt;
    private String readAt;

    public static NotificationDTO fromEntity(Notification notification) {
        return NotificationDTO.builder()
            .id(notification.getId())
            .type(notification.getType().name())
            .title(notification.getTitle())
            .message(notification.getMessage())
            .relatedEntityType(notification.getRelatedEntityType())
            .relatedEntityId(notification.getRelatedEntityId())
            .actionUrl(notification.getActionUrl())
            .priority(notification.getPriority().name())
            .isRead(notification.getIsRead())
            .createdAt(notification.getCreatedAt().toString())
            .readAt(notification.getReadAt() != null ? notification.getReadAt().toString() : null)
            .build();
    }
}
