package com.windchill.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;

/**
 * Generic API response wrapper used by REST controllers.
 *
 * Usage:
 *   return ResponseEntity.ok(ApiResponse.success(data));
 *   return ResponseEntity.badRequest().body(ApiResponse.error("message"));
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;

    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    /** Wrap a successful payload. */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    /** Wrap a successful payload with a custom message. */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    /** Return a success response with no payload (e.g. for deletes). */
    public static <T> ApiResponse<T> ok() {
        return new ApiResponse<>(true, "OK", null);
    }

    /** Wrap an error message with no payload. */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
