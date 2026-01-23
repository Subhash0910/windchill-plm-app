package com.windchill.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Generic API Response wrapper for all API endpoints.
 * Ensures consistent response format across the application.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
 * Response status - true for success, false for failure
     */
    private boolean success;

    /**
 * Response message for UI display or debugging
     */
    private String message;

    /**
 * Response data payload
     */
    private T data;

    /**
 * HTTP status code
     */
    private Integer statusCode;

    /**
 * Timestamp of the response
     */
    private Long timestamp;

    /**
 * Create a successful response
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
 * Create a successful response with just data
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Success");
    }

    /**
 * Create an error response
     */
    public static <T> ApiResponse<T> error(String message, Integer statusCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .statusCode(statusCode)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
* Create an error response (default 500)
     */
    public static <T> ApiResponse<T> error(String message) {
        return error(message, 500);
    }
}
