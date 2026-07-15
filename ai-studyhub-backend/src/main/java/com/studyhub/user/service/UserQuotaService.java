package com.studyhub.user.service;

import com.studyhub.common.enums.StorageStatus;
import com.studyhub.user.entity.User;

public interface UserQuotaService {
    
    record StorageQuotaSnapshot(
            long storageLimitMb,
            long storageLimitBytes,
            long storageUsedBytes,
            double storageUsedMb,
            StorageStatus storageStatus,
            boolean canUpload,
            String message
    ) {
        public boolean overQuota() {
            return storageStatus == StorageStatus.OVER_QUOTA;
        }
    }

    /**
     * Get user storage quota usage metrics.
     */
    StorageQuotaSnapshot getStorageQuotaSnapshot(User user);

    /**
     * Validate whether the user can upload a file of the given size.
     * Throws StorageQuotaExceededException if exceeded.
     */
    void validateUploadAllowed(User user, long incomingFileSizeBytes);

    /**
     * Check if the user has remaining AI request limits for the day.
     */
    boolean hasRemainingAiRequests(User user);
}
