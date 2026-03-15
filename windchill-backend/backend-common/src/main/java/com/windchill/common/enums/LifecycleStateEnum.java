package com.windchill.common.enums;

/**
 * Windchill-like lifecycle states.
 * All values stored in DB must match exactly (EnumType.STRING).
 */
public enum LifecycleStateEnum {
    INWORK,
    UNDER_REVIEW,
    RELEASED,
    OBSOLETE,
    SUPERSEDED
}
