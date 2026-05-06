package com.windchill.common.exception;

/**
 * Thrown by PolicyEnforcementService when a principal lacks the required
 * permission on a target object.
 *
 * This is distinct from Spring Security's AccessDeniedException — it is a
 * business-layer exception that controllers or filters can translate into
 * an HTTP 403 response.
 */
public class AccessDeniedException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public AccessDeniedException(String message) {
        super(message);
    }

    public AccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }

    /**
     * Convenience factory for the most common ACL denial.
     */
    public static AccessDeniedException forPermission(String principalName, String permission,
                                                      String targetType, Long targetId) {
        return new AccessDeniedException(String.format(
            "Access denied: '%s' lacks '%s' on %s %s",
            principalName, permission, targetType,
            targetId != null ? targetId.toString() : "ALL"));
    }
}
