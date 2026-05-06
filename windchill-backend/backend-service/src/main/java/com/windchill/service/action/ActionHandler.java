package com.windchill.service.action;

/**
 * ActionHandler interface — every Windchill action must implement this.
 *
 * Concrete handlers are discovered by ActionRegistry as Spring beans and
 * indexed by their action name. Each handler is responsible for a single
 * action (e.g. PART_PROMOTE, ECR_APPROVE).
 */
public interface ActionHandler {

    /**
     * The unique action name this handler is responsible for.
     * Must match a RegisteredAction.actionName value.
     */
    String getActionName();

    /**
     * Execute the action with the given context.
     *
     * @param context the action context containing target entity, user, and parameters
     * @return ActionResult indicating success/failure and any result data
     */
    ActionResult execute(ActionContext context);

    /**
     * Validate that the action can be executed in the current context.
     * Default implementation returns true (valid).
     *
     * Override to add business rule validation (lifecycle state, permissions, etc.)
     *
     * @param context the action context to validate
     * @return true if the action can proceed, false otherwise
     */
    default boolean validate(ActionContext context) {
        return true;
    }
}
