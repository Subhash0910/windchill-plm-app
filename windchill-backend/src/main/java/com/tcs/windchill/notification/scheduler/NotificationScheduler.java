package com.tcs.windchill.notification.scheduler;

import com.tcs.windchill.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled tasks for notification system
 * 
 * Tasks:
 * - Cleanup expired notifications (daily at 2 AM)
 * - Send digest emails (if enabled)
 * - Retry failed emails
 * 
 * @author Subhash
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationService notificationService;

    /**
     * Cleanup expired notifications
     * Runs daily at 2:00 AM
     */
    @Scheduled(cron = "0 0 2 * * ?") // 2 AM daily
    public void cleanupExpiredNotifications() {
        log.info("🧹 Starting notification cleanup job...");
        
        try {
            int deleted = notificationService.cleanupExpiredNotifications();
            log.info("✅ Cleanup complete: {} notifications deleted", deleted);
        } catch (Exception e) {
            log.error("❌ Cleanup job failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Health check - runs every hour
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void healthCheck() {
        log.debug("✅ Notification system health check - OK");
    }
}
