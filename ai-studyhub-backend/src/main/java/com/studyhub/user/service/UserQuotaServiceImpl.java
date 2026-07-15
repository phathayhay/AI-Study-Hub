package com.studyhub.user.service;

import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.common.StorageQuotaExceededException;
import com.studyhub.common.enums.SenderType;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserQuotaServiceImpl implements UserQuotaService {

    private final DocumentRepository documentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    @Override
    @Transactional(readOnly = true)
    public StorageQuotaSnapshot getStorageQuotaSnapshot(User user) {
        SubscriptionPlan effectivePlan = user.getPlan() != null ? user.getPlan() : getFreePlan();
        long usedStorageBytes = documentRepository.sumFileSizeByUserId(user.getId());
        long storageLimitBytes = getStorageLimitBytes(effectivePlan);
        boolean overQuota = user.getStorageStatus() == StorageStatus.OVER_QUOTA;

        if (storageLimitBytes > 0) {
            overQuota = usedStorageBytes > storageLimitBytes;
        }

        return buildStorageQuotaSnapshot(effectivePlan, usedStorageBytes, overQuota);
    }

    @Override
    @Transactional(readOnly = true)
    public void validateUploadAllowed(User user, long incomingFileSizeBytes) {
        StorageQuotaSnapshot snapshot = getStorageQuotaSnapshot(user);
        if (snapshot.overQuota()) {
            throw new StorageQuotaExceededException(snapshot.message());
        }

        if (snapshot.storageLimitBytes() > 0
                && snapshot.storageUsedBytes() + incomingFileSizeBytes > snapshot.storageLimitBytes()) {
            throw new StorageQuotaExceededException("Storage limit exceeded. Delete existing files or upgrade your plan.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRemainingAiRequests(User user) {
        SubscriptionPlan activePlan = user.getPlan() != null ? user.getPlan() : getFreePlan();
        Integer limit = activePlan.getAiRequestsPerDay();
        if (limit == null) {
            return true; // Unlimited
        }

        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long aiRequestsUsedToday = chatMessageRepository.countByUserIdAndSenderTypeBetween(
                user.getId(),
                SenderType.AI,
                startOfDay,
                endOfDay
        );

        return aiRequestsUsedToday < limit;
    }

    private SubscriptionPlan getFreePlan() {
        return subscriptionPlanRepository.findByPlanName("FREE")
                .orElseThrow(() -> new IllegalStateException("FREE plan not found"));
    }

    private long getStorageLimitBytes(SubscriptionPlan plan) {
        Long storageLimitMb = plan != null ? plan.getStorageLimitMb() : null;
        if (storageLimitMb == null || storageLimitMb <= 0) {
            return 0L;
        }
        return storageLimitMb * 1024L * 1024L;
    }

    private StorageQuotaSnapshot buildStorageQuotaSnapshot(SubscriptionPlan plan, long usedStorageBytes, boolean overQuota) {
        long storageLimitBytes = getStorageLimitBytes(plan);
        String message = null;
        if (overQuota) {
            String planName = plan != null && plan.getPlanName() != null ? plan.getPlanName().toUpperCase() : "FREE";
            message = "FREE".equals(planName)
                    ? "Your subscription has expired and your storage usage exceeds the FREE plan limit. You can still view, download, or delete existing files, but you cannot upload new files until you free up storage or upgrade your plan."
                    : String.format("Your current storage usage exceeds the %s plan limit. Delete some files or upgrade your plan to continue uploading.", planName);
        }

        return new StorageQuotaSnapshot(
                plan != null ? plan.getStorageLimitMb() : 0L,
                storageLimitBytes,
                usedStorageBytes,
                usedStorageBytes / (1024d * 1024d),
                overQuota ? StorageStatus.OVER_QUOTA : StorageStatus.NORMAL,
                !overQuota,
                message
        );
    }
}
