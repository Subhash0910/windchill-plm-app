package com.windchill.api.exception;

import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

/**
 * Global exception handler to ensure all API responses follow consistent format
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found: {} at {}", ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .build());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<?>> handleBusinessException(BusinessException ex, WebRequest request) {
        log.warn("Business rule violation: {} at {}", ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .data(null)
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGlobalException(Exception ex, WebRequest request) {
        log.error("❌ Unhandled exception: {} at {}", ex.getMessage(), request.getDescription(false), ex);
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.builder()
                .success(false)
                .message("Internal server error: " + ex.getMessage())
                .data(null)
                .build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        log.warn("⚠️ Invalid argument: {} at {}", ex.getMessage(), request.getDescription(false));
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.builder()
                .success(false)
                .message("Invalid request: " + ex.getMessage())
                .data(null)
                .build());
    }

    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ApiResponse<?>> handleNullPointerException(NullPointerException ex, WebRequest request) {
        log.error("❌ Null pointer exception at {}", request.getDescription(false), ex);
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.builder()
                .success(false)
                .message("Internal server error: Null value encountered")
                .data(null)
                .build());
    }
}
