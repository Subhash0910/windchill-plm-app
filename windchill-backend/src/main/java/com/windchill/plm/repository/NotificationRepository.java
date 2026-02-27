package com.windchill.plm.repository;

import com.windchill.plm.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

/**
 * Repository for Notification entity operations.
 * 
 * @author Subhash
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /**
     * Find all notifications for a user (paginated)
     */
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find unread notifications for a user
     */
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Find unread notifications for a user (paginated)
     */
    Page<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Count unread notifications for a user
     */
    long countByUserIdAndIsReadFalse(Long userId);

    /**
     * Find notifications by type for a user
     */
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, String type);

    /**
     * Find notifications for a specific entity
     */
    List<Notification> findByUserIdAndRelatedEntityTypeAndRelatedEntityId(
        Long userId, String entityType, Long entityId
    );

    /**
     * Find unsent email notifications
     */
    @Query("SELECT n FROM Notification n WHERE n.isEmailSent = false AND n.createdAt > :since ORDER BY n.createdAt ASC")
    List<Notification> findUnsentEmailNotifications(@Param("since") Instant since);

    /**
     * Find urgent unread notifications
     */
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.isRead = false AND n.priority = 'URGENT' ORDER BY n.createdAt DESC")
    List<Notification> findUrgentUnreadNotifications(@Param("userId") Long userId);

    /**
     * Mark notification as read
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id")
    void markAsRead(@Param("id") Long id, @Param("readAt") Instant readAt);

    /**
     * Mark all notifications as read for a user
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    void markAllAsReadForUser(@Param("userId") Long userId, @Param("readAt") Instant readAt);

    /**
     * Delete old read notifications (cleanup)
     * Deletes notifications that are read and older than specified date
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.readAt < :before")
    void deleteOldReadNotifications(@Param("before") Instant before);

    /**
     * Get notification statistics for a user
     */
    @Query("SELECT n.type as type, COUNT(n) as count FROM Notification n WHERE n.user.id = :userId GROUP BY n.type")
    List<Object[]> getNotificationStatsByUser(@Param("userId") Long userId);
}
