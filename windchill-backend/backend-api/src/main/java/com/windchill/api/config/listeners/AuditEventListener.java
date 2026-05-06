package com.windchill.api.config.listeners;

import com.windchill.api.config.EventContext;
import com.windchill.common.enums.PlmEntityTypeEnum;
import com.windchill.domain.entity.AuditLog;
import com.windchill.repository.AuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Generic audit listener — logs entity creation, update, and deletion events.
 *
 * Registered events: POST_CREATE, POST_UPDATE, POST_DELETE
 * Runs asynchronously (mirrors Windchill's async audit listeners).
 *
 * Records an AuditLog entry with entity type, id, action, actor, and details.
 */
@Component
public class AuditEventListener implements EventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditEventListener.class);

    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void onEvent(EventContext context) {
        log.debug("AuditEventListener fired: event={}, entityType={}, entityId={}, actor={}",
                context.getEventName(), context.getEntityType(),
                context.getEntityId(), context.getActor());

        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setEntityType(context.getEntityType() != null
                    ? context.getEntityType()
                    : PlmEntityTypeEnum.PART);
            auditLog.setEntityId(context.getEntityId() != null ? context.getEntityId() : 0L);
            auditLog.setAction(mapEventToAction(context.getEventName()));
            auditLog.setActor(context.getActor());
            auditLog.setDetails(buildDetails(context));

            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to save AuditLog for event={}, entityId={}",
                    context.getEventName(), context.getEntityId(), e);
        }
    }

    private String mapEventToAction(String eventName) {
        switch (eventName) {
            case "POST_CREATE": return "CREATE";
            case "POST_UPDATE": return "UPDATE";
            case "POST_DELETE": return "DELETE";
            default: return eventName.replace("POST_", "");
        }
    }

    private String buildDetails(EventContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Event: ").append(context.getEventName());
        if (context.getEntityType() != null) {
            sb.append(", EntityType: ").append(context.getEntityType());
        }
        if (context.getEntityNumber() != null) {
            sb.append(", EntityNumber: ").append(context.getEntityNumber());
        }
        if (context.getFromState() != null && context.getToState() != null) {
            sb.append(", StateChange: ").append(context.getFromState())
                    .append(" -> ").append(context.getToState());
        }
        if (context.getComment() != null && !context.getComment().isEmpty()) {
            sb.append(", Comment: ").append(context.getComment());
        }
        return sb.toString();
    }
}
