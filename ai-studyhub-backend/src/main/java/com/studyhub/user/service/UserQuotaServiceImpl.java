package com.studyhub.user.service;

import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.common.StorageQuotaExceededException;
import com.studyhub.common.AiQuotaExceededException;
import com.studyhub.common.enums.SenderType;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.ActivityLogRepository;
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
    private final ActivityLogRepository activityLogRepository;
    private final SubscriptionEntitlementService entitlementService;

    @Override
    @Transactional(readOnly = true)
    public StorageQuotaSnapshot getStorageQuotaSnapshot(User user) {
        SubscriptionEntitlementService.PlanBenefits effectivePlan = entitlementService.getActiveEntitlements(user).benefits();
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
        SubscriptionEntitlementService.PlanBenefits activePlan = entitlementService.getActiveEntitlements(user).benefits();
        Integer limit = activePlan.aiRequestsPerDay();
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
        aiRequestsUsedToday += activityLogRepository.countByUser_IdAndActionTypeStartingWithAndCreatedAtBetween(
                user.getId(), "AI_", startOfDay, endOfDay);

        return aiRequestsUsedToday < limit;
    }

    @Override
    @Transactional(readOnly = true)
    public void validateAiRequestAllowed(User user) {
        if (!hasRemainingAiRequests(user)) {
            throw new AiQuotaExceededException(
                    "You have reached today's AI request limit. Please try again tomorrow or upgrade your plan."
            );
        }
    }

    private long getStorageLimitBytes(SubscriptionEntitlementService.PlanBenefits plan) {
        Long storageLimitMb = plan != null ? plan.storageLimitMb() : null;
        if (storageLimitMb == null || storageLimitMb <= 0) {
            return 0L;
        }
        return storageLimitMb * 1024L * 1024L;
    }

    private StorageQuotaSnapshot buildStorageQuotaSnapshot(SubscriptionEntitlementService.PlanBenefits plan, long usedStorageBytes, boolean overQuota) {
        long storageLimitBytes = getStorageLimitBytes(plan);
        String message = null;
        if (overQuota) {
            String planName = plan != null && plan.planName() != null ? plan.planName().toUpperCase() : "FREE";
            message = "FREE".equals(planName)
                    ? "Your subscription has expired and your storage usage exceeds the FREE plan limit. You can still view, download, or delete existing files, but you cannot upload new files until you free up storage or upgrade your plan."
                    : String.format("Your current storage usage exceeds the %s plan limit. Delete some files or upgrade your plan to continue uploading.", planName);
        }

        return new StorageQuotaSnapshot(
                plan != null ? plan.storageLimitMb() : 0L,
                storageLimitBytes,
                usedStorageBytes,
                usedStorageBytes / (1024d * 1024d),
                overQuota ? StorageStatus.OVER_QUOTA : StorageStatus.NORMAL,
                !overQuota,
                message
        );
    }
}
