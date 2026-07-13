package com.studyhub.user.service;

import com.studyhub.common.enums.NotificationType;
import com.studyhub.user.dto.BillingHistoryResponse;
import com.studyhub.user.dto.SimulatePaymentRequest;
import com.studyhub.user.dto.SubscriptionPlanResponse;
import com.studyhub.user.dto.UpgradePaymentResponse;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getActivePlans() {
        log.info("Fetching active subscription plans");
        return subscriptionPlanRepository.findAll().stream()
                .filter(SubscriptionPlan::getIsActive)
                .map(plan -> SubscriptionPlanResponse.builder()
                        .id(plan.getId())
                        .planName(plan.getPlanName())
                        .description(plan.getDescription())
                        .price(plan.getPrice())
                        .storageLimitMb(plan.getStorageLimitMb())
                        .aiRequestsPerDay(plan.getAiRequestsPerDay())
                        .durationDays(plan.getDurationDays())
                        .canUseAiSummary(plan.getCanUseAiSummary())
                        .canUseFlashcards(plan.getCanUseFlashcards())
                        .canUseQuizzes(plan.getCanUseQuizzes())
                        .canPublishDocuments(plan.getCanPublishDocuments())
                        .canPublishFolders(plan.getCanPublishFolders())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UpgradePaymentResponse getUpgradePaymentInfo(Long planId, String email) {
        log.info("Generating payment info for plan {} and user {}", planId, email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SubscriptionPlan targetPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        if ("FREE".equalsIgnoreCase(targetPlan.getPlanName())) {
            throw new IllegalArgumentException("Cannot purchase or upgrade to FREE plan");
        }

        SubscriptionPlan currentPlan = user.getPlan();
        BigDecimal currentPlanPrice = currentPlan != null && currentPlan.getPrice() != null
                ? currentPlan.getPrice()
                : BigDecimal.ZERO;

        if (currentPlan != null && targetPlan.getPlanName().equalsIgnoreCase(currentPlan.getPlanName())) {
            throw new IllegalArgumentException("You are already using this plan.");
        }

        if (currentPlan != null && targetPlan.getPrice().compareTo(currentPlanPrice) < 0) {
            throw new IllegalArgumentException("Downgrade is not supported in this flow.");
        }

        BigDecimal amountDue = targetPlan.getPrice().subtract(currentPlanPrice).max(BigDecimal.ZERO);

        int randomCode = 1000 + new Random().nextInt(9000);
        String transferContent = String.format("SHUPGRADE %d %d %d", user.getId(), targetPlan.getId(), randomCode);

        String accountName = "CONG TY AI STUDYHUB FPT";
        String bankName = "TPBank";
        String accountNumber = "00004103937";
        String qrCodeUrl = buildVietQrUrl(bankName, accountNumber, amountDue, transferContent, accountName);

        return UpgradePaymentResponse.builder()
                .planId(targetPlan.getId())
                .planName(targetPlan.getPlanName())
                .currentPlanName(currentPlan != null ? currentPlan.getPlanName() : "FREE")
                .amount(amountDue)
                .currentPlanPrice(currentPlanPrice)
                .targetPlanPrice(targetPlan.getPrice())
                .creditApplied(currentPlanPrice)
                .durationDays(targetPlan.getDurationDays())
                .accountName(accountName)
                .bankName(bankName)
                .accountNumber(accountNumber)
                .transferContent(transferContent)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    @Transactional
    public void simulatePaymentSuccess(SimulatePaymentRequest request, String email) {
        log.info("Simulating payment success for user {} and plan {}", email, request.getPlanId());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SubscriptionPlan targetPlan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        SubscriptionPlan currentPlan = user.getPlan();
        if (currentPlan != null && targetPlan.getPlanName().equalsIgnoreCase(currentPlan.getPlanName())) {
            throw new IllegalArgumentException("You are already using this plan.");
        }

        List<UserSubscription> activeSubs = userSubscriptionRepository.findByUser_IdAndIsActiveTrue(user.getId());
        LocalDateTime preservedEndDate = activeSubs.stream()
                .map(UserSubscription::getEndDate)
                .filter(endDate -> endDate != null && endDate.isAfter(LocalDateTime.now()))
                .max(LocalDateTime::compareTo)
                .orElse(null);

        for (UserSubscription sub : activeSubs) {
            sub.setIsActive(false);
            userSubscriptionRepository.save(sub);
        }

        user.setPlan(targetPlan);
        userRepository.save(user);

        LocalDateTime startDate = LocalDateTime.now();
        LocalDateTime endDate = preservedEndDate != null
                ? preservedEndDate
                : startDate.plusDays(targetPlan.getDurationDays() != null ? targetPlan.getDurationDays() : 30L);

        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .plan(targetPlan)
                .startDate(startDate)
                .endDate(endDate)
                .isActive(true)
                .build();

        userSubscriptionRepository.save(newSub);
        notificationService.createNotification(
                user,
                "Plan Upgraded",
                String.format("Your %s plan is now active until %s.", targetPlan.getPlanName(), newSub.getEndDate().toLocalDate()),
                NotificationType.SYSTEM
        );
        log.info("Successfully upgraded user {} to plan {}", email, targetPlan.getPlanName());
    }

    @Transactional(readOnly = true)
    public List<BillingHistoryResponse> getBillingHistory(String email) {
        log.info("Fetching billing history for user {}", email);
        return userSubscriptionRepository.findByUser_EmailOrderByCreatedAtDesc(email).stream()
                .map(sub -> BillingHistoryResponse.builder()
                        .planName(sub.getPlan().getPlanName())
                        .startDate(sub.getStartDate())
                        .endDate(sub.getEndDate())
                        .isActive(sub.getIsActive())
                        .createdAt(sub.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    private String buildVietQrUrl(String bank, String account, BigDecimal amount, String content, String name) {
        try {
            String encodedContent = URLEncoder.encode(content, StandardCharsets.UTF_8.toString());
            String encodedName = URLEncoder.encode(name, StandardCharsets.UTF_8.toString());
            return String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                    mapBankCode(bank), account, amount.toPlainString(), encodedContent, encodedName
            );
        } catch (Exception e) {
            log.error("Failed to build VietQR URL: {}", e.getMessage());
            return String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s",
                    mapBankCode(bank), account, amount.toPlainString(), content
            );
        }
    }

    private String mapBankCode(String bankName) {
        if (bankName == null) {
            return "TPB";
        }

        String normalized = bankName.trim().toUpperCase();
        return switch (normalized) {
            case "TPBANK", "TPB" -> "TPB";
            case "MB", "MBBANK" -> "MB";
            default -> normalized;
        };
    }
}
