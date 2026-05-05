package com.windchill.common.exceptions;

/**
 * Extends the canonical BusinessException so GlobalExceptionHandler (which
 * handles common.exception.BusinessException) catches this subtype too.
 * This resolves the two-package split without touching 12 callers.
 */
public class BusinessException extends com.windchill.common.exception.BusinessException {
    private String errorCode;

    public BusinessException(String message) {
        super(message);
        this.errorCode = "BUSINESS_ERROR";
    }

    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "BUSINESS_ERROR";
    }

    public String getErrorCode() {
        return errorCode;
    }
}
