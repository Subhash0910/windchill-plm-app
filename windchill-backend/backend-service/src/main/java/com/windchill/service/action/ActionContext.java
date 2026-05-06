package com.windchill.service.action;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

/**
 * Context object passed to every ActionHandler.
 *
 * Carries the identity of the target entity, the current user, and any
 * additional parameters the caller supplies.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionContext {

    /** ID of the target entity (Part.id, ChangeRequest.id, etc.). */
    private Long targetId;

    /** Type of the target entity: PART, DOCUMENT, ECR, ECO, BOM, FOLDER. */
    private String targetType;

    /** Username of the current authenticated user. */
    private String currentUser;

    /** Arbitrary extra parameters for the action handler. */
    @Builder.Default
    private Map<String, Object> parameters = new HashMap<>();

    /**
     * The resolved target entity object (e.g. a Part instance).
     * Available after the ActionRegistry resolves it.
     */
    private Object entity;
}
