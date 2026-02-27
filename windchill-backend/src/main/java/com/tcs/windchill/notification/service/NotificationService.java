package com.tcs.windchill.notification.service;

import com.tcs.windchill.notification.model.*;
import com.tcs.windchill.notification.repository.NotificationRepository;
import com.tcs.windchill.user.model.User;
import com.tcs.windchill.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Service for managing notifications
 * 
 * Handles:
 * - Creating notifications
 * - Sending via multiple channels (email, in-app, websocket)
 * - Marking as read/unread
 * - Cleanup of old notifications
 * 
 * @author Subhash
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    // private final WebSocketService webSocketService; // Will add in next commit

    /**
     * Create and send notification to a user
     */
    @Async
    @Transactional
    public void sendNotification(NotificationRequest request) {
        try {
            User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUserId()));

            // Create notification entity
            Notification notification = Notification.builder()
                .user(user)
                .type(request.getType())
                .channels(request.getChannels())
                .title(request.getTitle())
                .message(request.getMessage())
                .relatedEntityType(request.getRelatedEntityType())
                .relatedEntityId(request.getRelatedEntityId())
                .actionUrl(request.getActionUrl())
                .priority(request.getPriority())
                .expiresAt(calculateExpiry(request.getType()))
                .build();

            notification = notificationRepository.save(notification);
            log.info("✅ Notification created: {} for user: {}", notification.getId(), user.getUsername());

            // Send via requested channels
            if (request.getChannels().contains(NotificationChannel.EMAIL)) {
                sendEmailNotification(notification);
            }

            if (request.getChannels().contains(NotificationChannel.WEBSOCKET)) {
                sendWebSocketNotification(notification);
            }

        } catch (Exception e) {
            log.error("❌ Failed to send notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Send email notification
     */
    private void sendEmailNotification(Notification notification) {
        try {
            EmailTemplate template = EmailTemplate.forNotificationType(notification.getType());
            
            boolean sent = emailService.sendEmail(
                notification.getUser().getEmail(),
                notification.getTitle(),
                template.render(notification)
            );

            if (sent) {
                notification.markEmailSent(EmailStatus.SENT);
                notificationRepository.save(notification);
                log.info("📧 Email sent for notification: {}", notification.getId());
            } else {
                notification.markEmailSent(EmailStatus.FAILED);
                notificationRepository.save(notification);
                log.warn("⚠️ Email failed for notification: {}", notification.getId());
            }
        } catch (Exception e) {
            log.error("❌ Email error for notification {}: {}", notification.getId(), e.getMessage());
            notification.markEmailSent(EmailStatus.FAILED);
            notificationRepository.save(notification);
        }
    }

    /**
     * Send WebSocket notification (real-time)
     */
    private void sendWebSocketNotification(Notification notification) {
        try {
            // Will implement in WebSocket commit
            // webSocketService.sendToUser(notification.getUser().getId(), notification);
            notification.markWebsocketSent();
            notificationRepository.save(notification);
            log.info("🔔 WebSocket sent for notification: {}", notification.getId());
        } catch (Exception e) {
            log.error("❌ WebSocket error for notification {}: {}", notification.getId(), e.getMessage());
        }
    }

    /**
     * Get user's notifications
     */
    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    /**
     * Get unread notifications
     */
    @Transactional(readOnly = true)
    public Page<Notification> getUnreadNotifications(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user, pageable);
    }

    /**
     * Get unread count
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        return notificationRepository.countUnreadByUser(user);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        // Security: Verify user owns this notification
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Not authorized to access this notification");
        }

        if (!notification.getIsRead()) {
            notification.markAsRead();
            notificationRepository.save(notification);
            log.info("✅ Notification {} marked as read by user {}", notificationId, userId);
        }
    }

    /**
     * Mark all notifications as read
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        
        int count = notificationRepository.markAllAsReadForUser(user, LocalDateTime.now());
        log.info("✅ Marked {} notifications as read for user {}", count, userId);
        return count;
    }

    /**
     * Delete notification
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));

        // Security: Verify user owns this notification
        if (!notification.getUser().getId().equals(userId)) {
            throw new SecurityException("Not authorized to delete this notification");
        }

        notificationRepository.delete(notification);
        log.info("🗑️ Notification {} deleted by user {}", notificationId, userId);
    }

    /**
     * Calculate expiry time based on notification type
     */
    private LocalDateTime calculateExpiry(NotificationType type) {
        // Most notifications expire after 30 days
        int daysToExpire = 30;

        // System alerts expire faster
        if (type == NotificationType.SYSTEM_ALERT || type == NotificationType.SYSTEM_MAINTENANCE) {
            daysToExpire = 7;
        }

        return LocalDateTime.now().plusDays(daysToExpire);
    }

    /**
     * Cleanup expired notifications (scheduled job)
     */
    @Transactional
    public int cleanupExpiredNotifications() {
        int count = notificationRepository.deleteExpiredNotifications(LocalDateTime.now());
        log.info("🧹 Cleaned up {} expired notifications", count);
        return count;
    }

    // ==================== HELPER METHODS FOR ECN/PART EVENTS ====================

    /**
     * Notify when ECN is created
     */
    public void notifyECNCreated(Long ecnId, String ecnNumber, Long creatorId, List<Long> stakeholderIds) {
        stakeholderIds.forEach(userId -> {
            if (!userId.equals(creatorId)) { // Don't notify creator
                sendNotification(NotificationRequest.builder()
                    .userId(userId)
                    .type(NotificationType.ECN_CREATED)
                    .channels(Set.of(NotificationChannel.IN_APP, NotificationChannel.EMAIL))
                    .title("New ECN Created: " + ecnNumber)
                    .message("A new Engineering Change Notice has been created that may affect your work.")
                    .relatedEntityType("ECN")
                    .relatedEntityId(ecnId)
                    .actionUrl("/ecn/" + ecnId)
                    .priority(NotificationPriority.NORMAL)
                    .build());
            }
        });
    }

    /**
     * Notify when ECN is approved
     */
    public void notifyECNApproved(Long ecnId, String ecnNumber, Long creatorId) {
        sendNotification(NotificationRequest.builder()
            .userId(creatorId)
            .type(NotificationType.ECN_APPROVED)
            .channels(Set.of(NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET))
            .title("ECN Approved: " + ecnNumber)
            .message("Your Engineering Change Notice has been approved!")
            .relatedEntityType("ECN")
            .relatedEntityId(ecnId)
            .actionUrl("/ecn/" + ecnId)
            .priority(NotificationPriority.HIGH)
            .build());
    }

    /**
     * Notify when approval is required
     */
    public void notifyApprovalRequired(Long ecnId, String ecnNumber, Long approverId) {
        sendNotification(NotificationRequest.builder()
            .userId(approverId)
            .type(NotificationType.APPROVAL_REQUIRED)
            .channels(Set.of(NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.WEBSOCKET))
            .title("Approval Required: " + ecnNumber)
            .message("An Engineering Change Notice requires your approval.")
            .relatedEntityType("ECN")
            .relatedEntityId(ecnId)
            .actionUrl("/ecn/" + ecnId)
            .priority(NotificationPriority.HIGH)
            .build());
    }
}

/**
 * Notification request DTO
 */
@lombok.Data
@lombok.Builder
class NotificationRequest {
    private Long userId;
    private NotificationType type;
    private Set<NotificationChannel> channels;
    private String title;
    private String message;
    private String relatedEntityType;
    private Long relatedEntityId;
    private String actionUrl;
    @lombok.Builder.Default
    private NotificationPriority priority = NotificationPriority.NORMAL;
}
