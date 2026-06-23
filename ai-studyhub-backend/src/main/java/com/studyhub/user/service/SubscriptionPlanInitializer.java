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

        initializePlan("FREE", "Gói học tập cơ bản miễn phí", BigDecimal.ZERO, 500L, 10);
        initializePlan("PRO", "Gói học tập nâng cao cho sinh viên", BigDecimal.valueOf(99000), 5120L, 100);
        initializePlan("PREMIUM", "Gói học tập không giới hạn cho Thủ khoa", BigDecimal.valueOf(199000), 20480L, 1000);

        // Đảm bảo có vai trò ADMIN và USER trong Database
        Role adminRole = roleRepository.findByRoleName("ADMIN")
                .orElseGet(() -> roleRepository.save(new Role(null, "ADMIN")));
        roleRepository.findByRoleName("USER")
                .orElseGet(() -> roleRepository.save(new Role(null, "USER")));

        // Tự động nâng cấp tài khoản test của bạn lên ADMIN
        userRepository.findByEmail("sd160020@fpt.edu.vn").ifPresent(user -> {
            if (user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole().getRoleName())) {
                log.info("System: Upgrading user {} to ADMIN role for testing", user.getEmail());
                user.setRole(adminRole);
                userRepository.save(user);
            }
        });
    }

    private void initializePlan(String planName, String description, BigDecimal price, Long storageLimitMb, Integer aiRequestsPerDay) {
        subscriptionPlanRepository.findByPlanName(planName).orElseGet(() -> {
            log.info("Seeding subscription plan: {}", planName);
            SubscriptionPlan plan = SubscriptionPlan.builder()
                    .planName(planName)
                    .description(description)
                    .price(price)
                    .storageLimitMb(storageLimitMb)
                    .aiRequestsPerDay(aiRequestsPerDay)
                    .isActive(true)
                    .build();
            return subscriptionPlanRepository.save(plan);
        });
    }
}
