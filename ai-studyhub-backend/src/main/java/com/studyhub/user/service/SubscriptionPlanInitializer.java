package com.studyhub.user.service;

import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.repository.RoleRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Slf4j
@Component
@RequiredArgsConstructor
public class SubscriptionPlanInitializer implements ApplicationRunner {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Checking subscription plans database initialization...");

        initializePlan("FREE", "Starter plan for new students", BigDecimal.ZERO, 50L, 10, 30, true, true, true, false, false);
        initializePlan("PRO", "More storage and publishing tools for active learners", BigDecimal.valueOf(99000), 500L, 100, 30, true, true, true, true, true);
        initializePlan("PREMIUM", "Highest storage and AI capacity for heavy study workflows", BigDecimal.valueOf(199000), 2048L, 1000, 30, true, true, true, true, true);

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role(null, "ADMIN")));
        roleRepository.findByRoleName("USER")
                .orElseGet(() -> roleRepository.save(new Role(null, "USER")));

        userRepository.findByEmail("sd160020@fpt.edu.vn").ifPresent(user -> {
            if (user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole().getRoleName())) {
                log.info("System: Upgrading user {} to ADMIN role for testing", user.getEmail());
                user.setRole(adminRole);
                userRepository.save(user);
            }
        });
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
        subscriptionPlanRepository.findByPlanName(planName).orElseGet(() -> {
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
}
