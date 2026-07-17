package com.studyhub.user.service;

import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.SubscriptionPlanVersion;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPlanVersionRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;

@Service
@RequiredArgsConstructor
public class SubscriptionEntitlementService {

    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionPlanVersionRepository planVersionRepository;

    @Transactional(readOnly = true)
    public ActiveEntitlements getActiveEntitlements(User user) {
        UserSubscription subscription = findActiveSubscription(user.getId());
        if (subscription != null && subscription.getPlanVersion() != null) {
            return new ActiveEntitlements(
                    subscription,
                    PlanBenefits.fromVersion(subscription.getPlanVersion()),
                    findUpcomingVersion(subscription)
            );
        }

        SubscriptionPlan fallback = user.getPlan() != null ? user.getPlan() : getFreePlan();
        SubscriptionPlanVersion latest = planVersionRepository
                .findFirstByPlan_IdOrderByVersionNumberDesc(fallback.getId())
                .orElse(null);
        PlanBenefits benefits = latest != null ? PlanBenefits.fromVersion(latest) : PlanBenefits.fromPlan(fallback);
        return new ActiveEntitlements(subscription, benefits, null);
    }

    @Transactional(readOnly = true)
    public UserSubscription findActiveSubscription(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return userSubscriptionRepository.findByUser_IdAndIsActiveTrue(userId).stream()
                .filter(item -> item.getEndDate() == null || item.getEndDate().isAfter(now))
                .max(Comparator.comparing(UserSubscription::getEndDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
    }

    private SubscriptionPlanVersion findUpcomingVersion(UserSubscription subscription) {
        if (subscription.getPlan() == null || subscription.getPlanVersion() == null) return null;
        return planVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(subscription.getPlan().getId())
                .filter(latest -> latest.getVersionNumber() > subscription.getPlanVersion().getVersionNumber())
                .orElse(null);
    }

    private SubscriptionPlan getFreePlan() {
        return subscriptionPlanRepository.findByPlanName("FREE")
                .orElseThrow(() -> new IllegalStateException("FREE plan not found"));
    }

    public record ActiveEntitlements(
            UserSubscription subscription,
            PlanBenefits benefits,
            SubscriptionPlanVersion upcomingVersion
    ) {}

    public record PlanBenefits(
            Long planId,
            Long versionId,
            Integer versionNumber,
            String planName,
            BigDecimal price,
            Long storageLimitMb,
            Integer aiRequestsPerDay,
            Integer downloadLimit,
            Integer bookmarkLimit,
            Integer durationDays,
            Boolean canUseAiSummary,
            Boolean canUseFlashcards,
            Boolean canUseQuizzes,
            Boolean canPublishDocuments,
            Boolean canPublishFolders
    ) {
        public static PlanBenefits fromVersion(SubscriptionPlanVersion version) {
            return new PlanBenefits(
                    version.getPlan().getId(), version.getId(), version.getVersionNumber(),
                    version.getPlanName(), version.getPrice(), version.getStorageLimitMb(),
                    version.getAiRequestsPerDay(), version.getDownloadLimit(), version.getBookmarkLimit(),
                    version.getDurationDays(), version.getCanUseAiSummary(), version.getCanUseFlashcards(),
                    version.getCanUseQuizzes(), version.getCanPublishDocuments(), version.getCanPublishFolders()
            );
        }

        public static PlanBenefits fromPlan(SubscriptionPlan plan) {
            return new PlanBenefits(
                    plan.getId(), null, null, plan.getPlanName(), plan.getPrice(), plan.getStorageLimitMb(),
                    plan.getAiRequestsPerDay(), plan.getDownloadLimit(), plan.getBookmarkLimit(), plan.getDurationDays(),
                    plan.getCanUseAiSummary(), plan.getCanUseFlashcards(), plan.getCanUseQuizzes(),
                    plan.getCanPublishDocuments(), plan.getCanPublishFolders()
            );
        }
    }
}
