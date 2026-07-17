package com.studyhub.user.service;

import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.repository.RoleRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPlanVersionRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import com.studyhub.user.entity.SubscriptionPlanVersion;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionPlanInitializer implements ApplicationRunner {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SubscriptionPlanVersionRepository planVersionRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Checking subscription plans database initialization...");

        initializePlan("FREE", "Starter plan for new students", BigDecimal.ZERO, 50L, 10, 30, true, true, true, false, false);
        initializePlan("PRO", "More storage and publishing tools for active learners", BigDecimal.valueOf(29000), 500L, 100, 30, true, true, true, true, true);
        initializePlan("PREMIUM", "Highest storage and AI capacity for heavy study workflows", BigDecimal.valueOf(69000), 2048L, 1000, 30, true, true, true, true, true);
        initializePlanVersionsAndBackfillSubscriptions();

        roleRepository.findByRoleName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role(null, "ADMIN")));
        roleRepository.findByRoleName("USER")
                .orElseGet(() -> roleRepository.save(new Role(null, "USER")));
    }

    private void initializePlan(
            String planName,
            String description,
            BigDecimal price,
            Long storageLimitMb,
            Integer aiRequestsPerDay,
            Integer durationDays,
            Boolean canUseAiSummary,
            Boolean canUseFlashcards,
            Boolean canUseQuizzes,
            Boolean canPublishDocuments,
            Boolean canPublishFolders
    ) {
        subscriptionPlanRepository.findByPlanName(planName)
                .map(existingPlan -> {
                    log.info("Subscription plan already exists; preserving admin configuration: {}", planName);
                    return existingPlan;
                })
                .orElseGet(() -> {
                    log.info("Seeding subscription plan: {}", planName);
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .planName(planName)
                            .description(description)
                            .price(price)
                            .storageLimitMb(storageLimitMb)
                            .aiRequestsPerDay(aiRequestsPerDay)
                            .durationDays(durationDays)
                            .canUseAiSummary(canUseAiSummary)
                            .canUseFlashcards(canUseFlashcards)
                            .canUseQuizzes(canUseQuizzes)
                            .canPublishDocuments(canPublishDocuments)
                            .canPublishFolders(canPublishFolders)
                            .isActive(true)
                            .build();
                    return subscriptionPlanRepository.save(plan);
                });
    }

    private void initializePlanVersionsAndBackfillSubscriptions() {
        subscriptionPlanRepository.findAll().forEach(plan -> {
            SubscriptionPlanVersion version = planVersionRepository
                    .findFirstByPlan_IdOrderByVersionNumberDesc(plan.getId())
                    .orElseGet(() -> planVersionRepository.save(SubscriptionPlanVersion.builder()
                            .plan(plan).versionNumber(1).planName(plan.getPlanName()).description(plan.getDescription()).price(plan.getPrice())
                            .storageLimitMb(plan.getStorageLimitMb()).aiRequestsPerDay(plan.getAiRequestsPerDay())
                            .downloadLimit(plan.getDownloadLimit()).bookmarkLimit(plan.getBookmarkLimit())
                            .durationDays(plan.getDurationDays()).canUseAiSummary(plan.getCanUseAiSummary())
                            .canUseFlashcards(plan.getCanUseFlashcards()).canUseQuizzes(plan.getCanUseQuizzes())
                            .canPublishDocuments(plan.getCanPublishDocuments()).canPublishFolders(plan.getCanPublishFolders())
                            .effectiveFrom(plan.getCreatedAt() != null ? plan.getCreatedAt() : LocalDateTime.now())
                            .build()));

            userSubscriptionRepository.findAll().stream()
                    .filter(subscription -> subscription.getPlanVersion() == null)
                    .filter(subscription -> subscription.getPlan() != null && subscription.getPlan().getId().equals(plan.getId()))
                    .forEach(subscription -> {
                        subscription.setPlanVersion(version);
                        if (subscription.getPricePaid() == null) subscription.setPricePaid(version.getPrice());
                        userSubscriptionRepository.save(subscription);
                    });

            if ("FREE".equalsIgnoreCase(plan.getPlanName())) {
                userRepository.findAll().stream()
                        .filter(user -> user.getPlan() != null && user.getPlan().getId().equals(plan.getId()))
                        .filter(user -> userSubscriptionRepository.findByUser_IdAndIsActiveTrue(user.getId()).isEmpty())
                        .forEach(user -> userSubscriptionRepository.save(UserSubscription.builder()
                                .user(user).plan(plan).planVersion(version).pricePaid(BigDecimal.ZERO)
                                .startDate(LocalDateTime.now()).endDate(null).isActive(true).autoRenew(false).build()));
            }
        });
    }
}
