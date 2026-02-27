package com.tcs.windchill.notification.repository;

import com.tcs.windchill.notification.model.Notification;
import com.tcs.windchill.notification.model.NotificationType;
import com.tcs.windchill.user.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Notification entity
 * 
 * Provides efficient queries with proper indexing
 * 
 * @author Subhash
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a user (paginated)
     */
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    Page<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Count unread notifications for a user
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false")
    Long countUnreadByUser(@Param("user") User user);

    /**
     * Find notifications by type
     */
    List<Notification> findByUserAndTypeOrderByCreatedAtDesc(User user, NotificationType type);

    /**
     * Find notifications for a specific entity
     */
    List<Notification> findByRelatedEntityTypeAndRelatedEntityId(String entityType, Long entityId);

    /**
     * Mark all user notifications as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user = :user AND n.isRead = false")
    int markAllAsReadForUser(@Param("user") User user, @Param("readAt") LocalDateTime readAt);

    /**
     * Delete expired notifications
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.expiresAt IS NOT NULL AND n.expiresAt < :now")
    int deleteExpiredNotifications(@Param("now") LocalDateTime now);

    /**
     * Find pending email notifications (not yet sent)
     */
    @Query("SELECT n FROM Notification n WHERE n.isEmailSent = false AND :email MEMBER OF n.channels AND n.createdAt > :since")
    List<Notification> findPendingEmailNotifications(@Param("email") NotificationChannel email, @Param("since") LocalDateTime since);

    /**
     * Find recent notifications for dashboard
     */
    @Query("SELECT n FROM Notification n WHERE n.user = :user AND n.createdAt > :since ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(@Param("user") User user, @Param("since") LocalDateTime since);
}
