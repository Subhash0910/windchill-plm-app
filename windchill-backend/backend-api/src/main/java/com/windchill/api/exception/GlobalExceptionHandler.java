package com.windchill.api.exception;

import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exception.AccessDeniedException;
import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.List;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        log.warn("Resource not found: {} at {}", ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.builder().success(false).message(ex.getMessage()).data(null).build());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        log.warn("Access denied: {} at {}", ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.builder().success(false).message(ex.getMessage()).data(null).build());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<?>> handleBusinessException(BusinessException ex, WebRequest request) {
        log.warn("Business rule violation: {} at {}", ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.builder().success(false).message(ex.getMessage()).data(null).build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex, WebRequest request) {
        List<String> errors = ex.getBindingResult().getFieldErrors()
            .stream().map(fe -> fe.getField() + ": " + fe.getDefaultMessage()).toList();
        log.warn("Validation failed at {}: {}", request.getDescription(false), errors);
        return ResponseEntity.badRequest()
            .body(ApiResponse.builder().success(false).message("Validation failed").data(errors).build());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<?>> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        log.warn("Invalid argument: {} at {}", ex.getMessage(), request.getDescription(false));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.builder().success(false).message("The request contains invalid parameters.").data(null).build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGlobal(Exception ex, WebRequest request) {
        log.error("Unhandled exception at {}", request.getDescription(false), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.builder().success(false).message("An unexpected error occurred. Please contact support.").data(null).build());
    }
}
