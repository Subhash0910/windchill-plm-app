package com.windchill.plm.service;

import com.windchill.plm.model.Notification;
import com.windchill.plm.model.User;
import com.windchill.plm.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Service for managing user notifications.
 * Handles both in-app and email notifications.
 * 
 * @author Subhash
 * @version 2.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;

    /**
     * Create a new notification for a user
     * 
     * @param user The user to notify
     * @param type Notification type
     * @param title Notification title
     * @param message Notification message
     * @param entityType Related entity type (optional)
     * @param entityId Related entity ID (optional)
     * @param actionUrl URL to navigate to (optional)
     * @param sendEmail Whether to send email notification
     * @return Created notification
     */
    @Transactional
    public Notification createNotification(
            User user,
            String type,
            String title,
            String message,
            String entityType,
            Long entityId,
            String actionUrl,
            boolean sendEmail) {
        
        log.info("Creating notification for user {}: type={}, title={}", user.getId(), type, title);
        
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityType(entityType)
                .relatedEntityId(entityId)
                .actionUrl(actionUrl)
                .priority(determinePriority(type))
                .isRead(false)
                .isEmailSent(false)
                .createdAt(Instant.now())
                .build();
        
        notification = notificationRepository.save(notification);
        log.info("✅ Notification created: id={}", notification.getId());
        
        // Send email asynchronously if requested
        if (sendEmail && user.getEmail() != null) {
            sendEmailNotificationAsync(notification);
        }
        
        return notification;
    }

    /**
     * Simplified notification creation (no email)
     */
    @Transactional
    public Notification createNotification(
            User user,
            String type,
            String title,
            String message) {
        return createNotification(user, type, title, message, null, null, null, false);
    }

    /**
     * Create notification with email
     */
    @Transactional
    public Notification createNotificationWithEmail(
            User user,
            String type,
            String title,
            String message,
            String entityType,
            Long entityId,
            String actionUrl) {
        return createNotification(user, type, title, message, entityType, entityId, actionUrl, true);
    }

    /**
     * Send email notification asynchronously
     */
    @Async
    public void sendEmailNotificationAsync(Notification notification) {
        try {
            log.info("Sending email notification: id={}", notification.getId());
            
            User user = notification.getUser();
            if (user.getEmail() == null || user.getEmail().isEmpty()) {
                log.warn("User {} has no email address, skipping", user.getId());
                return;
            }
            
            // Build email content based on notification type
            String subject = notification.getTitle();
            String body = buildEmailBody(notification);
            
            // Send email
            boolean sent = emailService.sendEmail(
                    user.getEmail(),
                    subject,
                    body,
                    true // HTML email
            );
            
            if (sent) {
                // Mark as sent
                notification.markEmailAsSent();
                notificationRepository.save(notification);
                log.info("✅ Email sent successfully for notification {}", notification.getId());
            } else {
                log.error("❌ Failed to send email for notification {}", notification.getId());
            }
            
        } catch (Exception e) {
            log.error("❌ Error sending email notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Get all notifications for a user (paginated)
     */
    @Transactional(readOnly = true)
    public Page<Notification> getUserNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notification count
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        log.info("Marking notification {} as read", notificationId);
        notificationRepository.markAsRead(notificationId, Instant.now());
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user {}", userId);
        notificationRepository.markAllAsReadForUser(userId, Instant.now());
    }

    /**
     * Delete a notification
     */
    @Transactional
    public void deleteNotification(Long notificationId) {
        log.info("Deleting notification {}", notificationId);
        notificationRepository.deleteById(notificationId);
    }

    /**
     * Scheduled job: Send pending email notifications
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void sendPendingEmailNotifications() {
        try {
            // Find unsent notifications from last 24 hours
            Instant since = Instant.now().minus(24, ChronoUnit.HOURS);
            List<Notification> pending = notificationRepository.findUnsentEmailNotifications(since);
            
            if (!pending.isEmpty()) {
                log.info("📧 Sending {} pending email notifications", pending.size());
                pending.forEach(this::sendEmailNotificationAsync);
            }
        } catch (Exception e) {
            log.error("❌ Error in scheduled email notification job: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled job: Cleanup old read notifications
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        try {
            // Delete read notifications older than 90 days
            Instant cutoff = Instant.now().minus(90, ChronoUnit.DAYS);
            notificationRepository.deleteOldReadNotifications(cutoff);
            log.info("🧹 Cleaned up old notifications older than 90 days");
        } catch (Exception e) {
            log.error("❌ Error cleaning up notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Build email body based on notification type
     */
    private String buildEmailBody(Notification notification) {
        String type = notification.getType();
        String message = notification.getMessage();
        String actionUrl = notification.getActionUrl();
        
        // Use HTML template based on type
        return emailService.buildEmailFromTemplate(type, Map.of(
                "title", notification.getTitle(),
                "message", message != null ? message : "",
                "actionUrl", actionUrl != null ? actionUrl : "",
                "userName", notification.getUser().getUsername()
        ));
    }

    /**
     * Determine priority based on notification type
     */
    private String determinePriority(String type) {
        return switch (type) {
            case "APPROVAL_REQUIRED", "ECN_REJECTED", "URGENT_CHANGE" -> "URGENT";
            case "ECN_APPROVED", "PART_STATE_CHANGED" -> "HIGH";
            case "COMMENT_ADDED", "MENTION" -> "MEDIUM";
            default -> "LOW";
        };
    }

    // ========================================================================
    // HELPER METHODS FOR SPECIFIC NOTIFICATION TYPES
    // ========================================================================

    /**
     * Notify when ECN is created
     */
    @Transactional
    public void notifyECNCreated(User recipient, Long ecnId, String ecnNumber, User creator) {
        createNotificationWithEmail(
                recipient,
                "ECN_CREATED",
                "New ECN Created: " + ecnNumber,
                String.format("%s created ECN %s", creator.getUsername(), ecnNumber),
                "ECN",
                ecnId,
                "/ecn/" + ecnId
        );
    }

    /**
     * Notify when ECN is approved
     */
    @Transactional
    public void notifyECNApproved(User recipient, Long ecnId, String ecnNumber, User approver) {
        createNotificationWithEmail(
                recipient,
                "ECN_APPROVED",
                "ECN Approved: " + ecnNumber,
                String.format("Your ECN %s was approved by %s", ecnNumber, approver.getUsername()),
                "ECN",
                ecnId,
                "/ecn/" + ecnId
        );
    }

    /**
     * Notify when approval is required
     */
    @Transactional
    public void notifyApprovalRequired(User approver, Long ecnId, String ecnNumber, User requester) {
        createNotificationWithEmail(
                approver,
                "APPROVAL_REQUIRED",
                "Approval Required: " + ecnNumber,
                String.format("%s requested your approval for ECN %s", requester.getUsername(), ecnNumber),
                "ECN",
                ecnId,
                "/ecn/" + ecnId
        );
    }

    /**
     * Notify when part state changes
     */
    @Transactional
    public void notifyPartStateChanged(User recipient, Long partId, String partNumber, String oldState, String newState) {
        createNotificationWithEmail(
                recipient,
                "PART_STATE_CHANGED",
                "Part State Changed: " + partNumber,
                String.format("Part %s changed from %s to %s", partNumber, oldState, newState),
                "PART",
                partId,
                "/parts/" + partId
        );
    }
}
