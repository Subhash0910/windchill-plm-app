package com.windchill.common.enums;

/**
 * Lifecycle states for a ChangeNotice (ECN).
 *
 * OPEN      — created when ECR is approved; pending distribution
 * RELEASED  — formally distributed to all stakeholders
 * OBSOLETE  — superseded by a later change notice
 */
public enum ChangeNoticeStatus {
    OPEN,
    RELEASED,
    OBSOLETE
}
