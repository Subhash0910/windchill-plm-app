package com.windchill.plm.model;

import lombok.*;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * Notification entity for tracking user notifications.
 * Supports both in-app notifications and email notifications.
 * 
 * @author Subhash
 * @version 2.0
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_user_read", columnList = "user_id,is_read"),
    @Index(name = "idx_created", columnList = "created_at"),
    @Index(name = "idx_type", columnList = "type")
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
     * Notification type
     * ECN_CREATED, ECN_APPROVED, ECN_REJECTED, PART_STATE_CHANGED,
     * APPROVAL_REQUIRED, COMMENT_ADDED, MENTION, TASK_ASSIGNED
     */
    @Column(name = "type", nullable = false, length = 50)
    private String type;

    /**
     * Notification title (short summary)
     */
    @Column(name = "title", nullable = false)
    private String title;

    /**
     * Detailed notification message
     */
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    /**
     * Type of related entity (ECN, PART, ECR, etc.)
     */
    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;

    /**
     * ID of related entity
     */
    @Column(name = "related_entity_id")
    private Long relatedEntityId;

    /**
     * URL to navigate to when notification is clicked
     */
    @Column(name = "action_url")
    private String actionUrl;

    /**
     * Whether notification has been read
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * Whether email notification has been sent
     */
    @Column(name = "is_email_sent", nullable = false)
    @Builder.Default
    private Boolean isEmailSent = false;

    /**
     * Priority level (LOW, MEDIUM, HIGH, URGENT)
     */
    @Column(name = "priority", length = 20)
    @Builder.Default
    private String priority = "MEDIUM";

    /**
     * When notification was created
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    /**
     * When notification was read
     */
    @Column(name = "read_at")
    private Instant readAt;

    /**
     * When email was sent
     */
    @Column(name = "email_sent_at")
    private Instant emailSentAt;

    /**
     * Additional metadata (JSON format)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * Mark notification as read
     */
    public void markAsRead() {
        this.isRead = true;
        this.readAt = Instant.now();
    }

    /**
     * Mark email as sent
     */
    public void markEmailAsSent() {
        this.isEmailSent = true;
        this.emailSentAt = Instant.now();
    }

    /**
     * Check if notification is urgent
     */
    public boolean isUrgent() {
        return "URGENT".equals(this.priority);
    }

    /**
     * Check if notification is unread
     */
    public boolean isUnread() {
        return !this.isRead;
    }
}
