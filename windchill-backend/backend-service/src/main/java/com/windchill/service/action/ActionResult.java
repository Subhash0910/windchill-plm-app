package com.windchill.service.action;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Result returned by every ActionHandler after execution.
 *
 * Informs the caller whether the action succeeded, provides a message,
 * and optionally includes data, a redirect URL, or validation errors.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionResult {

    /** Whether the action completed successfully. */
    private boolean success;

    /** Human-readable message for the UI. */
    private String message;

    /** Optional data payload (e.g. the modified entity). */
    private Object data;

    /** Optional URL to redirect the UI to after execution. */
    private String redirectUrl;

    /** Validation errors collected during validate(). */
    @Builder.Default
    private List<String> validationErrors = new ArrayList<>();

    // ── Convenience factory methods ───────────────────────────────────────────

    public static ActionResult success(String message) {
        return ActionResult.builder().success(true).message(message).build();
    }

    public static ActionResult success(String message, Object data) {
        return ActionResult.builder().success(true).message(message).data(data).build();
    }

    public static ActionResult failure(String message) {
        return ActionResult.builder().success(false).message(message).build();
    }

    public static ActionResult validationFailed(List<String> errors) {
        return ActionResult.builder()
                .success(false)
                .message("Validation failed")
                .validationErrors(errors)
                .build();
    }

    public static ActionResult redirect(String url) {
        return ActionResult.builder()
                .success(true)
                .message("Redirecting...")
                .redirectUrl(url)
                .build();
    }
}
