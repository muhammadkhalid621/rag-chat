package com.example.ragchat.exception;

public class AppException extends RuntimeException {
    private final int status;
    private final String code;

    public AppException(int status, String message) {
        this(status, message, null);
    }

    public AppException(int status, String message, String code) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public int getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }
}
