package com.windchill.api.config;

import com.windchill.common.enums.PlmEntityTypeEnum;

/**
 * Context object passed to event listeners when a lifecycle event fires.
 * Mirrors Windchill's event context passed to registered listeners.
 */
public class EventContext {

    private String eventName;
    private PlmEntityTypeEnum entityType;
    private Long entityId;
    private String entityNumber;
    private String fromState;
    private String toState;
    private String actor;
    private String comment;

    public EventContext() {}

    private EventContext(Builder builder) {
        this.eventName = builder.eventName;
        this.entityType = builder.entityType;
        this.entityId = builder.entityId;
        this.entityNumber = builder.entityNumber;
        this.fromState = builder.fromState;
        this.toState = builder.toState;
        this.actor = builder.actor;
        this.comment = builder.comment;
    }

    public static Builder builder() {
        return new Builder();
    }

    // Getters
    public String getEventName() { return eventName; }
    public PlmEntityTypeEnum getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getEntityNumber() { return entityNumber; }
    public String getFromState() { return fromState; }
    public String getToState() { return toState; }
    public String getActor() { return actor; }
    public String getComment() { return comment; }

    // Setters (needed for Jackson parsing)
    public void setEventName(String eventName) { this.eventName = eventName; }
    public void setEntityType(PlmEntityTypeEnum entityType) { this.entityType = entityType; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public void setEntityNumber(String entityNumber) { this.entityNumber = entityNumber; }
    public void setFromState(String fromState) { this.fromState = fromState; }
    public void setToState(String toState) { this.toState = toState; }
    public void setActor(String actor) { this.actor = actor; }
    public void setComment(String comment) { this.comment = comment; }

    public static class Builder {
        private String eventName;
        private PlmEntityTypeEnum entityType;
        private Long entityId;
        private String entityNumber;
        private String fromState;
        private String toState;
        private String actor;
        private String comment;

        public Builder eventName(String eventName) { this.eventName = eventName; return this; }
        public Builder entityType(PlmEntityTypeEnum entityType) { this.entityType = entityType; return this; }
        public Builder entityId(Long entityId) { this.entityId = entityId; return this; }
        public Builder entityNumber(String entityNumber) { this.entityNumber = entityNumber; return this; }
        public Builder fromState(String fromState) { this.fromState = fromState; return this; }
        public Builder toState(String toState) { this.toState = toState; return this; }
        public Builder actor(String actor) { this.actor = actor; return this; }
        public Builder comment(String comment) { this.comment = comment; return this; }

        public EventContext build() { return new EventContext(this); }
    }
}
