package com.windchill.service.impl;

import com.windchill.domain.entity.Notification;
import com.windchill.repository.NotificationRepository;
import com.windchill.service.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements INotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public Notification create(Long userId, String title, String message,
                               String type, String entityType, Long entityId, String entityNumber) {
        Notification n = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type != null ? type : "INFO")
                .entityType(entityType)
                .entityId(entityId)
                .entityNumber(entityNumber)
                .read(false)
                .build();
        Notification saved = notificationRepository.save(n);
        log.debug("Created notification [{}] for userId={}", saved.getId(), userId);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getAll(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long id, Long userId) {
        notificationRepository.markAsRead(id, userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void delete(Long id, Long userId) {
        notificationRepository.deleteByIdAndUserId(id, userId);
    }
}
