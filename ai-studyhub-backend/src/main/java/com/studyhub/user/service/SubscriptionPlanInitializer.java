package com.studyhub.user.service;

import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.RoleRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.annotation.Value;
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
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Value("${app.demo-account.enabled:false}")
    private boolean demoAccountEnabled;

    @Value("${app.demo-account.email:demo@studyhub.local}")
    private String demoAccountEmail;

    @Value("${app.demo-account.password:StudyHub@123}")
    private String demoAccountPassword;

    @Value("${app.demo-admin.enabled:false}")
    private boolean demoAdminEnabled;

    @Value("${app.demo-admin.email:admin@studyhub.local}")
    private String demoAdminEmail;

    @Value("${app.demo-admin.password:Admin@123}")
    private String demoAdminPassword;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Checking subscription plans database initialization...");

        initializePlan("FREE", "Starter plan for new students", BigDecimal.ZERO, 50L, 10, 30, true, true, true, false, false);
        initializePlan("PRO", "More storage and publishing tools for active learners", BigDecimal.valueOf(29000), 500L, 100, 30, true, true, true, true, true);
        initializePlan("PREMIUM", "Highest storage and AI capacity for heavy study workflows", BigDecimal.valueOf(69000), 2048L, 1000, 30, true, true, true, true, true);

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

        if (demoAccountEnabled) {
            seedDemoAccount();
        }

        if (demoAdminEnabled) {
            seedDemoAdmin();
        }
    }

    private void seedDemoAccount() {
        String email = demoAccountEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            log.info("Demo account already exists: {}", email);
            return;
        }

        Role userRole = roleRepository.findByRoleName("USER")
                .orElseThrow(() -> new IllegalStateException("USER role must exist before seeding demo account"));
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByPlanName("FREE")
                .orElseThrow(() -> new IllegalStateException("FREE plan must exist before seeding demo account"));

        User demoUser = User.builder()
                .firstName("Demo")
                .lastName("User")
                .email(email)
                .passwordHash(passwordEncoder.encode(demoAccountPassword))
                .plan(freePlan)
                .role(userRole)
                .status(com.studyhub.common.enums.UserStatus.ACTIVE)
                .verificationStatus(com.studyhub.common.enums.VerificationStatus.APPROVED)
                .verifiedAt(LocalDateTime.now())
                .build();

        userRepository.save(demoUser);
        log.warn("Seeded dev demo account {}. Do not enable app.demo-account.enabled in production.", email);
    }

    private void seedDemoAdmin() {
        String email = demoAdminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            log.info("Demo admin account already exists: {}", email);
            return;
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role must exist before seeding demo admin account"));
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByPlanName("FREE")
                .orElseThrow(() -> new IllegalStateException("FREE plan must exist before seeding demo admin account"));

        User demoAdmin = User.builder()
                .firstName("Demo")
                .lastName("Admin")
                .email(email)
                .passwordHash(passwordEncoder.encode(demoAdminPassword))
                .plan(freePlan)
                .role(adminRole)
                .status(com.studyhub.common.enums.UserStatus.ACTIVE)
                .verificationStatus(com.studyhub.common.enums.VerificationStatus.APPROVED)
                .verifiedAt(LocalDateTime.now())
                .build();

        userRepository.save(demoAdmin);
        log.warn("Seeded dev demo admin account {}. Do not enable app.demo-admin.enabled in production.", email);
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
                    existingPlan.setDescription(description);
                    existingPlan.setPrice(price);
                    existingPlan.setStorageLimitMb(storageLimitMb);
                    existingPlan.setAiRequestsPerDay(aiRequestsPerDay);
                    existingPlan.setDurationDays(durationDays);
                    existingPlan.setCanUseAiSummary(canUseAiSummary);
                    existingPlan.setCanUseFlashcards(canUseFlashcards);
                    existingPlan.setCanUseQuizzes(canUseQuizzes);
                    existingPlan.setCanPublishDocuments(canPublishDocuments);
                    existingPlan.setCanPublishFolders(canPublishFolders);
                    existingPlan.setIsActive(true);
                    log.info("Updating subscription plan: {}", planName);
                    return subscriptionPlanRepository.save(existingPlan);
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
}
