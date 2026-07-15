package com.studyhub.common;

public class StorageQuotaExceededException extends RuntimeException {

    public StorageQuotaExceededException(String message) {
        super(message);
    }
}
