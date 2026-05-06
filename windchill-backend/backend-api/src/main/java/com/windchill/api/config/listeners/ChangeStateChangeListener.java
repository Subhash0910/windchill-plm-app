package com.windchill.api.config.listeners;

import com.windchill.api.config.EventContext;
import com.windchill.domain.entity.Notification;
import com.windchill.repository.NotificationRepository;
import com.windchill.service.plm.StateHistoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Handles Change Request lifecycle state-change events.
 *
 * Registered events: POST_SUBMIT, POST_APPROVE, POST_REJECT, POST_CLOSE, POST_REOPEN
 *
 * Responsibilities:
 * - Logs state transitions
 * - Records StateHistory entries
 * - Creates user notifications for approval/rejection events
 *
 * Mirrors Windchill's ChangeEventListener.
 */
@Component
public class ChangeStateChangeListener implements EventListener {

    private static final Logger log = LoggerFactory.getLogger(ChangeStateChangeListener.class);

    private final NotificationRepository notificationRepository;
    private final StateHistoryService stateHistoryService;

    public ChangeStateChangeListener(NotificationRepository notificationRepository,
                                     StateHistoryService stateHistoryService) {
        this.notificationRepository = notificationRepository;
        this.stateHistoryService = stateHistoryService;
    }

    @Override
    public void onEvent(EventContext context) {
        log.info("ChangeStateChangeListener fired: event={}, entityId={}, from={}, to={}, actor={}",
                context.getEventName(), context.getEntityId(),
                context.getFromState(), context.getToState(), context.getActor());

        // 1. Log state history
        try {
            stateHistoryService.recordTransition(
                    "CHANGE_REQUEST",
                    context.getEntityId(),
                    context.getFromState(),
                    context.getToState(),
                    context.getEventName().replace("POST_", ""),
                    context.getActor(),
                    context.getComment());
        } catch (Exception e) {
            log.error("Failed to record StateHistory for change request {}", context.getEntityId(), e);
        }

        // 2. Create notification for submitted ECRs
        if ("POST_SUBMIT".equals(context.getEventName())) {
            createNotification(context, "ECR_SUBMITTED",
                    "ECR " + context.getEntityNumber() + " submitted for review",
                    "Change request " + context.getEntityNumber() + " has been submitted");
        }

        // 3. Create notification for approved ECRs
        if ("POST_APPROVE".equals(context.getEventName())) {
            createNotification(context, "ECR_APPROVED",
                    "ECR " + context.getEntityNumber() + " has been approved",
                    "Change request " + context.getEntityNumber()
                            + " approved. Comment: " + context.getComment());
        }

        // 4. Create notification for rejected ECRs
        if ("POST_REJECT".equals(context.getEventName())) {
            createNotification(context, "ECR_REJECTED",
                    "ECR " + context.getEntityNumber() + " has been rejected",
                    "Change request " + context.getEntityNumber()
                            + " rejected. Comment: " + context.getComment());
        }

        // 5. Create notification for closed ECRs
        if ("POST_CLOSE".equals(context.getEventName())) {
            createNotification(context, "ECR_CLOSED",
                    "ECR " + context.getEntityNumber() + " has been closed",
                    "Change request " + context.getEntityNumber() + " is now CLOSED");
        }

        // 6. Create notification for reopened ECRs
        if ("POST_REOPEN".equals(context.getEventName())) {
            createNotification(context, "ECR_REOPENED",
                    "ECR " + context.getEntityNumber() + " has been reopened",
                    "Change request " + context.getEntityNumber()
                            + " reopened for rework");
        }
    }

    private void createNotification(EventContext context, String type, String title, String message) {
        try {
            Notification notification = Notification.builder()
                    .userId(1L) // system notification
                    .title(title)
                    .message(message)
                    .type(type)
                    .entityType("CHANGE_REQUEST")
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
