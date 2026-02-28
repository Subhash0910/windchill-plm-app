package com.windchill.service.notification;

import com.windchill.domain.entity.Notification;

import java.util.List;

/**
 * Notification service interface.
 * Used by other services to create PLM event notifications
 * and by the controller to serve them to the frontend.
 */
public interface INotificationService {

    /**
     * Create a notification for a user.
     *
     * @param userId       target user id
     * @param title        short display title (e.g. "Part PART-001 promoted")
     * @param message      detailed message body
     * @param type         notification type string (INFO, PART_PROMOTED, TASK_ASSIGNED, etc.)
     * @param entityType   domain entity type (PART, WORK_ITEM, ECR, etc.) — nullable
     * @param entityId     database id of the entity — nullable
     * @param entityNumber human-readable number (e.g. "PART-001") — nullable
     */
    Notification createNotification(Long userId, String title, String message,
                                    String type, String entityType,
                                    Long entityId, String entityNumber);

    List<Notification> getNotificationsForUser(Long userId);

    List<Notification> getUnreadNotificationsForUser(Long userId);

    long getUnreadCountForUser(Long userId);

    boolean markAsRead(Long notificationId, Long userId);

    int markAllAsRead(Long userId);

    void deleteNotification(Long notificationId, Long userId);
}
