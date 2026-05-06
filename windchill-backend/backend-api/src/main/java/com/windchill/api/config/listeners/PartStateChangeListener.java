package com.windchill.api.config.listeners;

import com.windchill.api.config.EventContext;
import com.windchill.domain.entity.Notification;
import com.windchill.repository.NotificationRepository;
import com.windchill.service.plm.StateHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handles Part lifecycle state-change events.
 *
 * Registered events: POST_PROMOTE, POST_REVISE, POST_DEMOTE, POST_OBSOLETE
 *
 * Responsibilities:
 * - Logs state transitions
 * - Records StateHistory entries via StateHistoryService
 * - Creates user notifications for significant transitions
 *
 * Mirrors Windchill's PartStateChangeListenerDelegate.
 */
@Component
public class PartStateChangeListener implements EventListener {

    private static final Logger log = LoggerFactory.getLogger(PartStateChangeListener.class);

    private final NotificationRepository notificationRepository;
    private final StateHistoryService stateHistoryService;

    public PartStateChangeListener(NotificationRepository notificationRepository,
                                   StateHistoryService stateHistoryService) {
        this.notificationRepository = notificationRepository;
        this.stateHistoryService = stateHistoryService;
    }

    @Override
    public void onEvent(EventContext context) {
        log.info("PartStateChangeListener fired: event={}, entityId={}, from={}, to={}, actor={}",
                context.getEventName(), context.getEntityId(),
                context.getFromState(), context.getToState(), context.getActor());

        // 1. Log state history
        try {
            stateHistoryService.recordTransition(
                    "PART",
                    context.getEntityId(),
                    context.getFromState(),
                    context.getToState(),
                    context.getEventName().replace("POST_", ""),
                    context.getActor(),
                    context.getComment());
        } catch (Exception e) {
            log.error("Failed to record StateHistory for part {}", context.getEntityId(), e);
        }

        // 2. Create notification for released parts
        if ("POST_PROMOTE".equals(context.getEventName()) && "RELEASED".equals(context.getToState())) {
            createNotification(context, "PART_PROMOTED",
                    "Part " + context.getEntityNumber() + " has been released",
                    "Part " + context.getEntityNumber() + " promoted from "
                            + context.getFromState() + " to " + context.getToState());
        }

        // 3. Create notification for revised parts
        if ("POST_REVISE".equals(context.getEventName())) {
            createNotification(context, "PART_REVISED",
                    "Part " + context.getEntityNumber() + " has been revised",
                    "New iteration created for Part " + context.getEntityNumber());
        }

        // 4. Create notification for obsoleted parts
        if ("POST_OBSOLETE".equals(context.getEventName())) {
            createNotification(context, "PART_OBSOLETED",
                    "Part " + context.getEntityNumber() + " has been obsoleted",
                    "Part " + context.getEntityNumber() + " is now OBSOLETE");
        }
    }

    private void createNotification(EventContext context, String type, String title, String message) {
        try {
            Notification notification = Notification.builder()
                    .userId(1L) // system notification; real impl would resolve from actor
                    .title(title)
                    .message(message)
                    .type(type)
                    .entityType("PART")
                    .entityId(context.getEntityId())
                    .entityNumber(context.getEntityNumber())
                    .read(false)
                    .build();
            notificationRepository.save(notification);
        } catch (Exception e) {
            log.error("Failed to create notification for event {}", context.getEventName(), e);
        }
    }
}
