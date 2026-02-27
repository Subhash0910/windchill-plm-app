package com.tcs.windchill.notification.model;

import com.tcs.windchill.user.model.User;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Notification entity - Tracks all notifications sent to users
 * 
 * Supports multiple delivery channels:
 * - EMAIL: Sent via email service
 * - IN_APP: Shown in notification bell
 * - WEBSOCKET: Real-time push notification
 * 
 * @author Subhash
 * @version 2.0.0
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_user_read", columnList = "user_id,is_read"),
    @Index(name = "idx_created", columnList = "created_at"),
    @Index(name = "idx_type", columnList = "notification_type"),
    @Index(name = "idx_entity", columnList = "related_entity_type,related_entity_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User who receives this notification
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Notification type/category
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 50)
    private NotificationType type;

    /**
     * Delivery channels for this notification
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "notification_channels", 
                     joinColumns = @JoinColumn(name = "notification_id"))
    @Column(name = "channel")
    @Enumerated(EnumType.STRING)
    private java.util.Set<NotificationChannel> channels;

    /**
     * Notification title (shown in UI)
     */
    @Column(name = "title", nullable = false)
    private String title;

    /**
     * Notification message/body
     */
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    /**
     * Related entity type (ECN, PART, ECR, USER, etc.)
     */
    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;

    /**
     * Related entity ID
     */
    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    /**
     * Action link (e.g., /ecn/123, /parts/456)
     */
    @Column(name = "action_url", length = 500)
    private String actionUrl;

    /**
     * Priority level (affects UI display)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20)
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.NORMAL;

    /**
     * Read status
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * When the notification was read
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * Email sent status
     */
    @Column(name = "is_email_sent", nullable = false)
    @Builder.Default
    private Boolean isEmailSent = false;

    /**
     * When email was sent
     */
    @Column(name = "email_sent_at")
    private LocalDateTime emailSentAt;

    /**
     * Email delivery status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "email_status", length = 20)
    private EmailStatus emailStatus;

    /**
     * WebSocket delivery status
     */
    @Column(name = "is_websocket_sent", nullable = false)
    @Builder.Default
    private Boolean isWebsocketSent = false;

    /**
     * Creation timestamp
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Expiry date (for cleanup)
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Mark notification as read
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }

    /**
     * Mark email as sent
     */
    public void markEmailSent(EmailStatus status) {
        this.isEmailSent = true;
        this.emailSentAt = LocalDateTime.now();
        this.emailStatus = status;
    }

    /**
     * Mark WebSocket as delivered
     */
    public void markWebsocketSent() {
        this.isWebsocketSent = true;
    }

    /**
     * Check if notification is expired
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}

/**
 * Notification types - determines icon, color, and behavior
 */
enum NotificationType {
    // ECN notifications
    ECN_CREATED,
    ECN_UPDATED,
    ECN_APPROVED,
    ECN_REJECTED,
    ECN_SUBMITTED,
    ECN_COMMENT_ADDED,
    
    // Part notifications
    PART_CREATED,
    PART_UPDATED,
    PART_STATE_CHANGED,
    PART_DELETED,
    
    // ECR notifications
    ECR_CREATED,
    ECR_UPDATED,
    ECR_APPROVED,
    ECR_REJECTED,
    
    // Approval notifications
    APPROVAL_REQUIRED,
    APPROVAL_COMPLETED,
    APPROVAL_DELEGATED,
    
    // User notifications
    USER_MENTIONED,
    TASK_ASSIGNED,
    
    // System notifications
    SYSTEM_ALERT,
    SYSTEM_MAINTENANCE
}

/**
 * Delivery channels
 */
enum NotificationChannel {
    EMAIL,      // Send via email
    IN_APP,     // Show in notification bell
    WEBSOCKET   // Real-time push
}

/**
 * Notification priority
 */
enum NotificationPriority {
    LOW,
    NORMAL,
    HIGH,
    URGENT
}

/**
 * Email delivery status
 */
enum EmailStatus {
    PENDING,    // Queued for sending
    SENT,       // Successfully sent
    DELIVERED,  // Confirmed delivery (if webhook available)
    BOUNCED,    // Email bounced
    FAILED      // Sending failed
}
