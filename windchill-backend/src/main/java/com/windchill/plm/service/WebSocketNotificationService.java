package com.windchill.plm.service;

import com.windchill.plm.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Service for sending real-time WebSocket notifications.
 * 
 * @author Subhash
 * @version 2.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Send notification to specific user via WebSocket
     * 
     * @param username Username to send to
     * @param notification Notification to send
     */
    public void sendNotificationToUser(String username, Notification notification) {
        try {
            log.info("📡 Sending WebSocket notification to user: {}", username);
            
            messagingTemplate.convertAndSendToUser(
                    username,
                    "/queue/notifications",
                    notification
            );
            
            log.info("✅ WebSocket notification sent to {}", username);
            
        } catch (Exception e) {
            log.error("❌ Failed to send WebSocket notification to {}: {}", username, e.getMessage());
        }
    }

    /**
     * Send notification count update to user
     */
    public void sendUnreadCountUpdate(String username, long unreadCount) {
        try {
            messagingTemplate.convertAndSendToUser(
                    username,
                    "/queue/notifications/count",
                    Map.of("unreadCount", unreadCount)
            );
            
            log.debug("🔔 Sent unread count to {}: {}", username, unreadCount);
            
        } catch (Exception e) {
            log.error("❌ Failed to send count update: {}", e.getMessage());
        }
    }

    /**
     * Broadcast message to all users (use sparingly)
     */
    public void broadcastToAll(String message) {
        try {
            log.info("📢 Broadcasting to all users: {}", message);
            
            messagingTemplate.convertAndSend(
                    "/topic/announcements",
                    Map.of("message", message, "timestamp", System.currentTimeMillis())
            );
            
        } catch (Exception e) {
            log.error("❌ Broadcast failed: {}", e.getMessage());
        }
    }

    /**
     * Send real-time update about entity change
     */
    public void sendEntityUpdate(String entityType, Long entityId, String action, Object data) {
        try {
            String topic = String.format("/topic/%s/%d", entityType.toLowerCase(), entityId);
            
            messagingTemplate.convertAndSend(topic, Map.of(
                    "entityType", entityType,
                    "entityId", entityId,
                    "action", action,
                    "data", data,
                    "timestamp", System.currentTimeMillis()
            ));
            
            log.debug("🔄 Entity update sent: {}/{} - {}", entityType, entityId, action);
            
        } catch (Exception e) {
            log.error("❌ Entity update failed: {}", e.getMessage());
        }
    }
}
