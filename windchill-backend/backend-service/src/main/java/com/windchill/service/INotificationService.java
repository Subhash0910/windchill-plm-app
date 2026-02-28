package com.windchill.service;

import com.windchill.domain.entity.Notification;
import java.util.List;

public interface INotificationService {

    /**
     * Create a new notification for a user.
     * Called internally when PLM events occur (promote, approve, reject, etc.).
     */
    Notification create(Long userId, String title, String message,
                        String type, String entityType, Long entityId, String entityNumber);

    List<Notification> getUnread(Long userId);

    List<Notification> getAll(Long userId);

    long getUnreadCount(Long userId);

    void markAsRead(Long id, Long userId);

    void markAllAsRead(Long userId);

    void delete(Long id, Long userId);
}
