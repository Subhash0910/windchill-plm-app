package com.windchill.api.exception;

import com.windchill.common.dto.ApiResponse;
import com.windchill.common.exception.BusinessException;
import com.windchill.common.exception.ResourceNotFoundException;
import com.windchill.common.exception.UnauthorizedException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorizedException(
            UnauthorizedException ex,
            WebRequest request) {
        ApiResponse<Void> apiResponse = ApiResponse.builder()
            .success(false)
            .message(ex.getMessage() != null ? ex.getMessage() : "Unauthorized access")
            .build();
        return new ResponseEntity<>(apiResponse, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex,
            WebRequest request) {
        ApiResponse<Void> apiResponse = ApiResponse.builder()
            .success(false)
            .message(ex.getMessage() != null ? ex.getMessage() : "Resource not found")
            .build();
        return new ResponseEntity<>(apiResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(
            BusinessException ex,
            WebRequest request) {
        ApiResponse<Void> apiResponse = ApiResponse.builder()
            .success(false)
            .message(ex.getMessage() != null ? ex.getMessage() : "Business operation failed")
            .build();
        return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });
        
        ApiResponse<Map<String, String>> apiResponse = ApiResponse.builder()
            .success(false)
            .message("Validation failed")
            .data(errors)
            .build();
        return new ResponseEntity<>(apiResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(
            Exception ex,
            WebRequest request) {
        ex.printStackTrace();
        ApiResponse<Void> apiResponse = ApiResponse.builder()
            .success(false)
            .message("An unexpected error occurred: " + ex.getMessage())
            .build();
        return new ResponseEntity<>(apiResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
