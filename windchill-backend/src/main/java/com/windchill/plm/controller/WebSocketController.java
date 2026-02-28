package com.windchill.plm.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocket message controller.
 * Handles incoming WebSocket messages from clients.
 * 
 * @author Subhash
 * @version 2.0
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    /**
     * Handle ping messages (heartbeat)
     */
    @MessageMapping("/ping")
    @SendToUser("/queue/pong")
    public Map<String, Object> handlePing(Principal principal) {
        log.debug("🏓 Ping received from: {}", principal.getName());
        return Map.of(
                "message", "pong",
                "timestamp", System.currentTimeMillis()
        );
    }

    /**
     * Mark notification as read via WebSocket
     */
    @MessageMapping("/notifications/read")
    @SendToUser("/queue/notifications/ack")
    public Map<String, Object> markAsRead(Long notificationId, Principal principal) {
        log.info("✅ Notification {} marked as read by {}", notificationId, principal.getName());
        
        // TODO: Call NotificationService.markAsRead(notificationId)
        
        return Map.of(
                "notificationId", notificationId,
                "status", "read",
                "timestamp", System.currentTimeMillis()
        );
    }
}
