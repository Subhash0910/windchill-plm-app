package com.windchill.common.enums;

/**
 * Priority levels for a ChangeRequest.
 *
 * LOW      — cosmetic / documentation change, no operational impact
 * NORMAL   — standard engineering change (default)
 * HIGH     — affects form/fit/function of a released part
 * CRITICAL — safety / regulatory issue; must be fast-tracked
 */
public enum ChangePriority {
    LOW,
    NORMAL,
    HIGH,
    CRITICAL
}
