package com.windchill.api.config.listeners;

import com.windchill.api.config.EventContext;

/**
 * Contract for Windchill event listeners.
 * Registered via XML listener files and invoked by EventManager
 * when matching lifecycle events fire.
 */
@FunctionalInterface
public interface EventListener {

    /**
     * Called when a registered event fires.
     *
     * @param context event context containing entity, state, and actor information
     */
    void onEvent(EventContext context);
}
