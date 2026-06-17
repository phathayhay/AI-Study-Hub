package com.studyhub.user.service;

import com.studyhub.user.dto.*;
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

    /**
     * Lấy danh sách các gói dịch vụ đang hoạt động.
     */
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
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Tạo thông tin thanh toán giả lập với mã QR chuyển khoản VietQR động.
     */
    @Transactional(readOnly = true)
    public UpgradePaymentResponse getUpgradePaymentInfo(Long planId, String email) {
        log.info("Generating payment info for plan {} and user {}", planId, email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        if ("FREE".equalsIgnoreCase(plan.getPlanName())) {
            throw new IllegalArgumentException("Cannot purchase/upgrade to FREE plan");
        }

        // Tạo nội dung chuyển khoản ngẫu nhiên nhưng đặc trưng
        int randomCode = 1000 + new Random().nextInt(9000);
        String transferContent = String.format("SHUPGRADE %d %d %d", user.getId(), plan.getId(), randomCode);

        String accountName = "CONG TY AI STUDYHUB FPT";
        String bankName = "MB"; // MB Bank (Ngân hàng Quân đội)
        String accountNumber = "1234567890";
        BigDecimal price = plan.getPrice();

        // Xây dựng VietQR Image Link
        String qrCodeUrl = buildVietQrUrl(bankName, accountNumber, price, transferContent, accountName);

        return UpgradePaymentResponse.builder()
                .planId(plan.getId())
                .planName(plan.getPlanName())
                .amount(price)
                .accountName(accountName)
                .bankName(bankName)
                .accountNumber(accountNumber)
                .transferContent(transferContent)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    /**
     * Giả lập thanh toán thành công chuyển khoản để nâng cấp gói tức thì.
     */
    @Transactional
    public void simulatePaymentSuccess(SimulatePaymentRequest request, String email) {
        log.info("Simulating payment success for user {} and plan {}", email, request.getPlanId());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SubscriptionPlan plan = subscriptionPlanRepository.findById(request.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        // 1. Tắt toàn bộ gói dịch vụ cũ đang hoạt động của người dùng
        List<UserSubscription> activeSubs = userSubscriptionRepository.findByUser_IdAndIsActiveTrue(user.getId());
        for (UserSubscription sub : activeSubs) {
            sub.setIsActive(false);
            userSubscriptionRepository.save(sub);
        }

        // 2. Cập nhật gói dịch vụ trực tiếp trong bảng người dùng
        user.setPlan(plan);
        userRepository.save(user);

        // 3. Lưu lịch sử giao dịch và thời gian hoạt động gói mới
        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(30)) // Gói có giá trị trong 30 ngày
                .isActive(true)
                .build();

        userSubscriptionRepository.save(newSub);
        log.info("Successfully upgraded user {} to plan {}", email, plan.getPlanName());
    }

    /**
     * Lấy lịch sử giao dịch thanh toán của người dùng hiện tại.
     */
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

    /**
     * Hỗ trợ sinh URL VietQR
     */
    private String buildVietQrUrl(String bank, String account, BigDecimal amount, String content, String name) {
        try {
            String encodedContent = URLEncoder.encode(content, StandardCharsets.UTF_8.toString());
            String encodedName = URLEncoder.encode(name, StandardCharsets.UTF_8.toString());
            return String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                    bank, account, amount.toPlainString(), encodedContent, encodedName
            );
        } catch (Exception e) {
            log.error("Failed to build VietQR URL: {}", e.getMessage());
            // Fallback URL
            return String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s",
                    bank, account, amount.toPlainString(), content
            );
        }
    }
}
