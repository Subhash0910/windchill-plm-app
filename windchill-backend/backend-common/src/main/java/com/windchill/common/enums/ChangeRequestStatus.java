package com.windchill.common.enums;

/**
 * Lifecycle states for a ChangeRequest (ECR).
 *
 * DRAFT      — created but not yet submitted for review
 * SUBMITTED  — submitted; awaiting a reviewer to pick it up
 * IN_REVIEW  — reviewer has opened the ECR and is actively reviewing
 * APPROVED   — reviewer approved; impacted parts are auto-revised; ECN created
 * REJECTED   — reviewer rejected; back to originator for rework
 * CLOSED     — terminal state; can be reached from APPROVED or REJECTED
 */
public enum ChangeRequestStatus {
    DRAFT,
    SUBMITTED,
    IN_REVIEW,
    APPROVED,
    REJECTED,
    CLOSED
}
