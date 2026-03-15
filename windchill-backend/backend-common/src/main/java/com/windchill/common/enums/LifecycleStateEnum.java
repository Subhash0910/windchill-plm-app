package com.windchill.common.enums;

/**
 * Windchill-like lifecycle states.
 *
 * UNDER_REVIEW  – canonical name used by the frontend and new records
 * UNDERREVIEW   – legacy alias kept for backward-compat with existing DB rows
 * SUPERSEDED    – part replaced by a newer revision
 */
public enum LifecycleStateEnum {
    INWORK,
    UNDER_REVIEW,
    UNDERREVIEW,   // legacy alias — kept so old DB values still deserialise
    RELEASED,
    OBSOLETE,
    SUPERSEDED
}
