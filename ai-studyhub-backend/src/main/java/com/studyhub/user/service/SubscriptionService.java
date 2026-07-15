package com.studyhub.user.service;

import com.studyhub.common.enums.NotificationType;
import com.studyhub.common.enums.PaymentStatus;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.common.StorageQuotaExceededException;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.payment.helper.VietQrHelper;
import com.studyhub.user.dto.BillingHistoryResponse;
import com.studyhub.user.dto.PaymentStatusResponse;
import com.studyhub.user.dto.PaymentWebhookRequest;
import com.studyhub.user.dto.SimulatePaymentRequest;
import com.studyhub.user.dto.SubscriptionPlanResponse;
import com.studyhub.user.dto.UpgradePaymentResponse;
import com.studyhub.admin.dto.SubscriptionPlanRequest;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.SubscriptionPayment;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPaymentRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final SubscriptionPaymentRepository subscriptionPaymentRepository;
    private final NotificationService notificationService;
    private final DocumentRepository documentRepository;

    // Injected Quota service
    private final UserQuotaService userQuotaService;

    @Value("${app.payment.bank-name:TPBank}")
    private String paymentBankName;

    @Value("${app.payment.account-name:CONG TY AI STUDYHUB FPT}")
    private String paymentAccountName;

    @Value("${app.payment.account-number:00004103937}")
    private String paymentAccountNumber;

    @Value("${app.payment.provider-name:BANK_TRANSFER}")
    private String paymentProviderName;

    @Value("${app.payment.order-expiry-minutes:30}")
    private long paymentOrderExpiryMinutes;

    @Value("${app.payment.webhook-secret:}")
    private String webhookSecret;

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

    @Transactional
    public UpgradePaymentResponse getUpgradePaymentInfo(Long planId, String email) {
        log.info("Generating payment info for plan {} and user {}", planId, email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SubscriptionPlan targetPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        SubscriptionPlan currentPlan = user.getPlan();
        UserSubscription currentSubscription = findCurrentActiveSubscription(user.getId());
        UpgradeQuote quote = calculateUpgradeQuote(currentPlan, targetPlan, currentSubscription, LocalDateTime.now());
        expirePendingPayment(user.getId(), targetPlan.getId());

        SubscriptionPayment payment = createPendingPayment(user, currentPlan, targetPlan, quote);

        return UpgradePaymentResponse.builder()
                .planId(targetPlan.getId())
                .planName(targetPlan.getPlanName())
                .currentPlanName(currentPlan != null ? currentPlan.getPlanName() : "FREE")
                .amount(payment.getAmount())
                .currentPlanPrice(quote.currentPlanPrice())
                .targetPlanPrice(targetPlan.getPrice())
                .creditApplied(quote.creditApplied())
                .remainingDays(quote.remainingDays())
                .billingCycleDays(quote.billingCycleDays())
                .currentPeriodEndDate(quote.currentPeriodEndDate())
                .durationDays(targetPlan.getDurationDays())
                .accountName(payment.getAccountName())
                .bankName(payment.getBankName())
                .accountNumber(payment.getAccountNumber())
                .paymentCode(payment.getPaymentCode())
                .transferContent(payment.getTransferContent())
                .qrCodeUrl(payment.getQrCodeUrl())
                .paymentStatus(payment.getStatus().name())
                .expiresAt(payment.getExpiresAt())
                .build();
    }

    @Transactional
    public void simulatePaymentSuccess(SimulatePaymentRequest request, String email) {
        log.info("Simulating payment success for user {} and plan {}", email, request.getPlanId());

        SubscriptionPayment payment = subscriptionPaymentRepository.findByTransferContent(request.getTransferContent())
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        if (!Objects.equals(payment.getUser().getEmail(), email)) {
            throw new IllegalArgumentException("You do not have permission to confirm this payment request");
        }

        if (!Objects.equals(payment.getTargetPlan().getId(), request.getPlanId())) {
            throw new IllegalArgumentException("Payment request does not match the requested plan");
        }

        if (payment.getStatus() == PaymentStatus.PAID) {
            log.info("Demo payment {} already processed", payment.getPaymentCode());
            return;
        }

        if (isExpired(payment)) {
            payment.setStatus(PaymentStatus.EXPIRED);
            subscriptionPaymentRepository.save(payment);
            throw new IllegalStateException("Payment request has expired");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setProviderName(blankToDefault(payment.getProviderName(), paymentProviderName));
        payment.setProviderTransactionRef("DEMO-" + payment.getPaymentCode());
        subscriptionPaymentRepository.save(payment);

        activatePlanForUser(payment.getUser(), payment.getTargetPlan(), payment.getPaidAt(), payment);
    }

    @Transactional
    public PaymentStatusResponse getPaymentStatus(String paymentCode, String email) {
        SubscriptionPayment payment = subscriptionPaymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        if (!Objects.equals(payment.getUser().getEmail(), email)) {
            throw new IllegalArgumentException("You do not have permission to view this payment request");
        }

        if (isExpired(payment) && payment.getStatus() == PaymentStatus.PENDING) {
            payment.setStatus(PaymentStatus.EXPIRED);
            subscriptionPaymentRepository.save(payment);
        }

        return mapPaymentStatus(payment);
    }

    @Transactional
    public void processPaymentWebhook(PaymentWebhookRequest request, String secretHeader) {
        validateWebhookSecret(secretHeader);

        SubscriptionPayment payment = subscriptionPaymentRepository.findByTransferContent(request.getTransferContent())
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        if (payment.getStatus() == PaymentStatus.PAID) {
            log.info("Payment {} already processed", payment.getPaymentCode());
            return;
        }

        if (isExpired(payment)) {
            payment.setStatus(PaymentStatus.EXPIRED);
            subscriptionPaymentRepository.save(payment);
            throw new IllegalStateException("Payment request has expired");
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());
        payment.setProviderName(blankToDefault(request.getProviderName(), paymentProviderName));
        payment.setProviderTransactionRef(request.getTransactionReference());
        subscriptionPaymentRepository.save(payment);

        activatePlanForUser(payment.getUser(), payment.getTargetPlan(), payment.getPaidAt(), payment);
    }

    @Transactional(readOnly = true)
    public List<BillingHistoryResponse> getBillingHistory(String email) {
        log.info("Fetching billing history for user {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return subscriptionPaymentRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.PENDING)
                .map(payment -> BillingHistoryResponse.builder()
                        .planName(payment.getTargetPlan().getPlanName())
                        .amount(payment.getAmount())
                        .paidAt(payment.getPaidAt() != null ? payment.getPaidAt() : payment.getCreatedAt())
                        .paymentStatus(payment.getStatus().name())
                        .transactionRef(payment.getProviderTransactionRef())
                        .isActive(payment.getStatus() == PaymentStatus.PAID)
                        .createdAt(payment.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void checkExpiredSubscriptions() {
        log.info("Scheduled: Checking expired subscriptions");
        LocalDateTime now = LocalDateTime.now();

        List<UserSubscription> expiredSubscriptions = userSubscriptionRepository.findByIsActiveTrueAndEndDateBefore(now);
        for (UserSubscription subscription : expiredSubscriptions) {
            subscription.setIsActive(false);
            userSubscriptionRepository.save(subscription);

            User user = subscription.getUser();
            SubscriptionPlan freePlan = getFreePlan();
            user.setPlan(freePlan);

            // Re-sync storage status using decomposed service
            UserQuotaService.StorageQuotaSnapshot quota = userQuotaService.getStorageQuotaSnapshot(user);
            user.setStorageStatus(quota.storageStatus());
            userRepository.save(user);

            notificationService.createNotification(
                    user,
                    "Subscription expired",
                    "Your paid plan expired and your account returned to FREE. Uploading is disabled until you free up storage or upgrade again.",
                    NotificationType.SYSTEM
            );
        }
    }

    @Transactional
    public StorageQuotaSnapshot syncStorageStatus(User user) {
        return syncStorageStatus(user, user.getPlan());
    }

    @Transactional
    public StorageQuotaSnapshot syncStorageStatus(User user, SubscriptionPlan referencePlan) {
        SubscriptionPlan effectivePlan = referencePlan != null ? referencePlan : getFreePlan();
        long usedStorageBytes = documentRepository.sumFileSizeByUserId(user.getId());
        long storageLimitBytes = getStorageLimitBytes(effectivePlan);
        boolean overQuota = storageLimitBytes > 0 && usedStorageBytes > storageLimitBytes;

        user.setStorageStatus(overQuota ? StorageStatus.OVER_QUOTA : StorageStatus.NORMAL);
        userRepository.save(user);

        return buildStorageQuotaSnapshot(effectivePlan, usedStorageBytes, overQuota);
    }

    @Transactional(readOnly = true)
    public StorageQuotaSnapshot getStorageQuotaSnapshot(User user) {
        UserQuotaService.StorageQuotaSnapshot quota = userQuotaService.getStorageQuotaSnapshot(user);
        return new StorageQuotaSnapshot(
                quota.storageLimitMb(),
                quota.storageLimitBytes(),
                quota.storageUsedBytes(),
                quota.storageUsedMb(),
                quota.storageStatus(),
                quota.canUpload(),
                quota.message()
        );
    }

    @Transactional(readOnly = true)
    public void validateUploadAllowed(User user, long incomingFileSizeBytes) {
        userQuotaService.validateUploadAllowed(user, incomingFileSizeBytes);
    }

    private BigDecimal validateUpgradeFlow(SubscriptionPlan currentPlan, SubscriptionPlan targetPlan) {
        BigDecimal currentPrice = currentPlan != null ? currentPlan.getPrice() : BigDecimal.ZERO;
        BigDecimal targetPrice = targetPlan.getPrice();

        if (targetPrice == null) {
            throw new IllegalArgumentException("Plan price must not be null");
        }

        if (targetPrice.compareTo(currentPrice) <= 0) {
            throw new IllegalArgumentException("Target plan must be higher than current plan");
        }

        return targetPrice;
    }

    private UpgradeQuote calculateUpgradeQuote(
            SubscriptionPlan currentPlan,
            SubscriptionPlan targetPlan,
            UserSubscription currentSubscription,
            LocalDateTime upgradeDate
    ) {
        BigDecimal targetPrice = validateUpgradeFlow(currentPlan, targetPlan);
        BigDecimal currentPrice = currentPlan != null ? currentPlan.getPrice() : BigDecimal.ZERO;

        if (currentSubscription == null || currentPrice.compareTo(BigDecimal.ZERO) == 0) {
            return new UpgradeQuote(targetPrice, currentPrice, BigDecimal.ZERO, 0L, 0L, null);
        }

        BigDecimal amountDue = calculateProRatedUpgradeAmount(
                currentPrice,
                targetPrice,
                currentSubscription.getStartDate(),
                currentSubscription.getEndDate(),
                upgradeDate
        );

        long billingCycleDays = ChronoUnit.DAYS.between(currentSubscription.getStartDate().toLocalDate(), currentSubscription.getEndDate().toLocalDate());
        long remainingDays = ChronoUnit.DAYS.between(upgradeDate.toLocalDate(), currentSubscription.getEndDate().toLocalDate());
        BigDecimal creditApplied = targetPrice.subtract(amountDue);

        return new UpgradeQuote(
                amountDue,
                currentPrice,
                creditApplied,
                remainingDays,
                billingCycleDays,
                currentSubscription.getEndDate()
        );
    }

    private BigDecimal calculateProRatedUpgradeAmount(
            BigDecimal currentPrice,
            BigDecimal targetPrice,
            LocalDateTime startDate,
            LocalDateTime endDate,
            LocalDateTime upgradeDate
    ) {
        if (targetPrice == null) {
            throw new IllegalArgumentException("Plan price must not be null");
        }

        if (targetPrice.compareTo(currentPrice) <= 0) {
            throw new IllegalArgumentException("Target plan must be higher than current plan");
        }

        if (startDate == null || endDate == null || upgradeDate == null) {
            return targetPrice;
        }

        long billingCycleDays = ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate());
        long remainingDays = ChronoUnit.DAYS.between(upgradeDate.toLocalDate(), endDate.toLocalDate());

        if (billingCycleDays <= 0) {
            throw new IllegalStateException("Invalid subscription billing cycle");
        }

        if (remainingDays <= 0) {
            return targetPrice;
        }

        BigDecimal difference = targetPrice.subtract(currentPrice);
        return difference
                .multiply(BigDecimal.valueOf(remainingDays))
                .divide(BigDecimal.valueOf(billingCycleDays), 0, RoundingMode.HALF_UP);
    }

    private SubscriptionPayment createPendingPayment(
            User user,
            SubscriptionPlan currentPlan,
            SubscriptionPlan targetPlan,
            UpgradeQuote quote
    ) {
        BigDecimal amountDue = quote.amountDue();
        String paymentCode = generatePaymentCode(user.getId(), targetPlan.getId());
        String transferContent = paymentCode;

        // Call decoupled payment helper
        String qrCodeUrl = VietQrHelper.buildVietQrUrl(
                paymentBankName,
                paymentAccountNumber,
                amountDue,
                transferContent,
                paymentAccountName
        );

        SubscriptionPayment payment = SubscriptionPayment.builder()
                .user(user)
                .currentPlan(currentPlan)
                .targetPlan(targetPlan)
                .paymentCode(paymentCode)
                .transferContent(transferContent)
                .amount(amountDue)
                .status(PaymentStatus.PENDING)
                .bankName(paymentBankName)
                .accountName(paymentAccountName)
                .accountNumber(paymentAccountNumber)
                .providerName(paymentProviderName)
                .qrCodeUrl(qrCodeUrl)
                .expiresAt(LocalDateTime.now().plusMinutes(paymentOrderExpiryMinutes))
                .build();

        return subscriptionPaymentRepository.save(payment);
    }

    private void activatePlanForUser(
            User user,
            SubscriptionPlan targetPlan,
            LocalDateTime paymentSuccessTime,
            SubscriptionPayment payment
    ) {
        List<UserSubscription> activeSubs = userSubscriptionRepository.findByUser_IdAndIsActiveTrue(user.getId());
        UserSubscription activeSubscription = activeSubs.stream()
                .filter(sub -> sub.getEndDate() != null && sub.getEndDate().isAfter(paymentSuccessTime))
                .max(Comparator.comparing(UserSubscription::getEndDate))
                .orElse(null);

        boolean preserveCurrentCycle = activeSubscription != null
                && payment.getCurrentPlan() != null
                && !"FREE".equalsIgnoreCase(payment.getCurrentPlan().getPlanName())
                && targetPlan.getPrice().compareTo(payment.getCurrentPlan().getPrice()) > 0;

        user.setPlan(targetPlan);
        syncStorageStatus(user, targetPlan);

        if (preserveCurrentCycle) {
            for (UserSubscription sub : activeSubs) {
                if (!Objects.equals(sub.getId(), activeSubscription.getId())) {
                    sub.setIsActive(false);
                    userSubscriptionRepository.save(sub);
                }
            }

            activeSubscription.setPlan(targetPlan);
            activeSubscription.setIsActive(true);
            userSubscriptionRepository.save(activeSubscription);
            notifyPlanUpgrade(user, targetPlan, activeSubscription.getEndDate());
            return;
        }

        for (UserSubscription sub : activeSubs) {
            sub.setIsActive(false);
            userSubscriptionRepository.save(sub);
        }

        LocalDateTime startDate = paymentSuccessTime;
        LocalDateTime endDate = paymentSuccessTime.plusDays(targetPlan.getDurationDays() != null ? targetPlan.getDurationDays() : 30L);

        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .plan(targetPlan)
                .startDate(startDate)
                .endDate(endDate)
                .isActive(true)
                .build();

        userSubscriptionRepository.save(newSub);
        notifyPlanUpgrade(user, targetPlan, newSub.getEndDate());
    }

    private void notifyPlanUpgrade(User user, SubscriptionPlan targetPlan, LocalDateTime endDate) {
        notificationService.createNotification(
                user,
                "Plan Upgraded",
                String.format("Your %s plan is now active until %s.", targetPlan.getPlanName(), endDate.toLocalDate()),
                NotificationType.SYSTEM
            );
    }

    private PaymentStatusResponse mapPaymentStatus(SubscriptionPayment payment) {
        PaymentStatus status = payment.getStatus();
        String message = switch (status) {
            case PAID -> "Payment confirmed. Your plan is active.";
            case EXPIRED -> "This payment request expired. Please create a new one.";
            case FAILED -> "This payment could not be matched. Please contact support.";
            case CANCELLED -> "This payment request was cancelled.";
            case PENDING -> "Waiting for the bank transfer confirmation.";
        };

        return PaymentStatusResponse.builder()
                .paymentCode(payment.getPaymentCode())
                .planId(payment.getTargetPlan().getId())
                .planName(payment.getTargetPlan().getPlanName())
                .amount(payment.getAmount())
                .status(status)
                .transferContent(payment.getTransferContent())
                .createdAt(payment.getCreatedAt())
                .expiresAt(payment.getExpiresAt())
                .paidAt(payment.getPaidAt())
                .finalStatus(status != PaymentStatus.PENDING)
                .message(message)
                .build();
    }

    private void expirePendingPayment(Long userId, Long targetPlanId) {
        subscriptionPaymentRepository
                .findFirstByUser_IdAndTargetPlan_IdAndStatusOrderByCreatedAtDesc(userId, targetPlanId, PaymentStatus.PENDING)
                .ifPresent(payment -> {
                    payment.setStatus(isExpired(payment) ? PaymentStatus.EXPIRED : PaymentStatus.CANCELLED);
                    subscriptionPaymentRepository.save(payment);
                });
    }

    private UserSubscription findCurrentActiveSubscription(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return userSubscriptionRepository.findByUser_IdAndIsActiveTrue(userId).stream()
                .filter(sub -> sub.getEndDate() == null || sub.getEndDate().isAfter(now))
                .max(Comparator.comparing(UserSubscription::getEndDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);
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

    private boolean isExpired(SubscriptionPayment payment) {
        return payment.getExpiresAt() != null && payment.getExpiresAt().isBefore(LocalDateTime.now());
    }

    private String generatePaymentCode(Long userId, Long planId) {
        String shortId = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "SHU" + userId + "P" + planId + shortId;
    }

    private void validateWebhookSecret(String secretHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Payment webhook secret is not configured. Webhook requests are accepted without signature validation.");
            return;
        }

        if (!webhookSecret.equals(secretHeader)) {
            throw new IllegalArgumentException("Invalid webhook signature");
        }
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record UpgradeQuote(
            BigDecimal amountDue,
            BigDecimal currentPlanPrice,
            BigDecimal creditApplied,
            long remainingDays,
            long billingCycleDays,
            LocalDateTime currentPeriodEndDate
    ) {}

    public record StorageQuotaSnapshot(
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

    // ── Subscription Plans CRUD ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllPlans() {
        return subscriptionPlanRepository.findAll();
    }

    @Transactional
    public SubscriptionPlan createPlan(SubscriptionPlanRequest request) {
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planName(request.getPlanName().toUpperCase())
                .description(request.getDescription())
                .price(request.getPrice())
                .storageLimitMb(request.getStorageLimitMb())
                .aiRequestsPerDay(request.getAiRequestsPerDay())
                .durationDays(request.getDurationDays())
                .canUseAiSummary(request.getCanUseAiSummary())
                .canUseFlashcards(request.getCanUseFlashcards())
                .canUseQuizzes(request.getCanUseQuizzes())
                .canPublishDocuments(request.getCanPublishDocuments())
                .canPublishFolders(request.getCanPublishFolders())
                .isActive(request.getIsActive())
                .build();
        return subscriptionPlanRepository.save(plan);
    }

    @Transactional
    public SubscriptionPlan updatePlan(Long id, SubscriptionPlanRequest request) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        plan.setPlanName(request.getPlanName().toUpperCase());
        plan.setDescription(request.getDescription());
        plan.setPrice(request.getPrice());
        plan.setStorageLimitMb(request.getStorageLimitMb());
        plan.setAiRequestsPerDay(request.getAiRequestsPerDay());
        plan.setDurationDays(request.getDurationDays());
        plan.setCanUseAiSummary(request.getCanUseAiSummary());
        plan.setCanUseFlashcards(request.getCanUseFlashcards());
        plan.setCanUseQuizzes(request.getCanUseQuizzes());
        plan.setCanPublishDocuments(request.getCanPublishDocuments());
        plan.setCanPublishFolders(request.getCanPublishFolders());
        plan.setIsActive(request.getIsActive());
        return subscriptionPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!subscriptionPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Subscription plan not found");
        }
        subscriptionPlanRepository.deleteById(id);
    }
}
