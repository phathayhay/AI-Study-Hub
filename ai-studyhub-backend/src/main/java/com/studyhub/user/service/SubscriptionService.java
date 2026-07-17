package com.studyhub.user.service;

import com.studyhub.common.enums.NotificationType;
import com.studyhub.common.enums.PaymentStatus;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.common.StorageQuotaExceededException;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.payment.helper.VietQrHelper;
import com.studyhub.payment.PaymentGateway;
import com.studyhub.user.dto.BillingHistoryResponse;
import com.studyhub.user.dto.CurrentSubscriptionResponse;
import com.studyhub.user.dto.PaymentStatusResponse;
import com.studyhub.user.dto.PaymentWebhookRequest;
import com.studyhub.user.dto.SimulatePaymentRequest;
import com.studyhub.user.dto.SubscriptionPlanResponse;
import com.studyhub.user.dto.SubscriptionPlanVersionResponse;
import com.studyhub.user.dto.UpgradePaymentResponse;
import com.studyhub.admin.dto.SubscriptionPlanRequest;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.SubscriptionPayment;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.entity.SubscriptionPlanVersion;
import com.studyhub.user.entity.ActivityLog;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPaymentRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import com.studyhub.user.repository.SubscriptionPlanVersionRepository;
import com.studyhub.user.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
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
    private final SubscriptionPlanVersionRepository planVersionRepository;
    private final ActivityLogRepository activityLogRepository;
    private final SubscriptionEntitlementService entitlementService;
    private final PaymentGateway paymentGateway;

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
                .map(plan -> {
                    SubscriptionPlanVersion latest = getLatestPlanVersion(plan);
                    return SubscriptionPlanResponse.builder()
                        .id(plan.getId())
                        .planName(plan.getPlanName())
                        .description(plan.getDescription())
                        .price(latest.getPrice())
                        .storageLimitMb(latest.getStorageLimitMb())
                        .aiRequestsPerDay(latest.getAiRequestsPerDay())
                        .downloadLimit(latest.getDownloadLimit())
                        .bookmarkLimit(latest.getBookmarkLimit())
                        .latestVersionId(latest.getId())
                        .latestVersionNumber(latest.getVersionNumber())
                        .durationDays(latest.getDurationDays())
                        .canUseAiSummary(latest.getCanUseAiSummary())
                        .canUseFlashcards(latest.getCanUseFlashcards())
                        .canUseQuizzes(latest.getCanUseQuizzes())
                        .canPublishDocuments(latest.getCanPublishDocuments())
                        .canPublishFolders(latest.getCanPublishFolders())
                        .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public UpgradePaymentResponse getUpgradePaymentInfo(Long planId, String email) {
        log.info("Generating payment info for plan {} and user {}", planId, email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        SubscriptionPlan targetPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        if (!Boolean.TRUE.equals(targetPlan.getIsActive())) {
            throw new IllegalArgumentException("This subscription plan is not available for purchase");
        }

        SubscriptionPlanVersion targetVersion = getLatestPlanVersion(targetPlan);

        SubscriptionPlan currentPlan = user.getPlan();
        UserSubscription currentSubscription = findCurrentActiveSubscription(user.getId());
        SubscriptionPlanVersion currentVersion = currentSubscription != null ? currentSubscription.getPlanVersion() : null;
        UpgradeQuote quote = calculateUpgradeQuote(currentPlan, currentVersion, targetPlan, targetVersion, currentSubscription, LocalDateTime.now());
        expirePendingPayment(user.getId(), targetPlan.getId());

        SubscriptionPayment payment = createPendingPayment(user, currentPlan, currentVersion, targetPlan, targetVersion, quote);
        PaymentGateway.CheckoutSession checkout = paymentGateway.createCheckout(payment);

        return UpgradePaymentResponse.builder()
                .planId(targetPlan.getId())
                .planName(targetPlan.getPlanName())
                .currentPlanName(currentPlan != null ? currentPlan.getPlanName() : "FREE")
                .amount(payment.getAmount())
                .currentPlanPrice(quote.currentPlanPrice())
                .targetPlanPrice(targetVersion.getPrice())
                .creditApplied(quote.creditApplied())
                .remainingDays(quote.remainingDays())
                .billingCycleDays(quote.billingCycleDays())
                .currentPeriodEndDate(quote.currentPeriodEndDate())
                .durationDays(targetVersion.getDurationDays())
                .accountName(payment.getAccountName())
                .bankName(payment.getBankName())
                .accountNumber(payment.getAccountNumber())
                .paymentCode(payment.getPaymentCode())
                .transferContent(payment.getTransferContent())
                .qrCodeUrl(payment.getQrCodeUrl())
                .paymentStatus(payment.getStatus().name())
                .expiresAt(payment.getExpiresAt())
                .checkoutUrl(checkout.checkoutUrl())
                .paymentMode(paymentGateway.isSandbox() ? "SANDBOX" : "PRODUCTION")
                .targetPlanVersionId(targetVersion.getId())
                .targetPlanVersionNumber(targetVersion.getVersionNumber())
                .build();
    }

    @Transactional
    public SubscriptionPayment createVnpayPendingPayment(Long planId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        SubscriptionPlan targetPlan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));
        if (!Boolean.TRUE.equals(targetPlan.getIsActive())) {
            throw new IllegalArgumentException("This subscription plan is not available for purchase");
        }

        SubscriptionPlanVersion targetVersion = getLatestPlanVersion(targetPlan);
        SubscriptionPlan currentPlan = user.getPlan();
        UserSubscription currentSubscription = findCurrentActiveSubscription(user.getId());
        SubscriptionPlanVersion currentVersion = currentSubscription != null ? currentSubscription.getPlanVersion() : null;
        UpgradeQuote quote = calculateUpgradeQuote(
                currentPlan, currentVersion, targetPlan, targetVersion, currentSubscription, LocalDateTime.now());
        expirePendingPayment(user.getId(), targetPlan.getId());

        SubscriptionPayment payment = createPendingPayment(
                user, currentPlan, currentVersion, targetPlan, targetVersion, quote);
        payment.setProviderName("VNPAY");
        payment.setPaymentMode("SANDBOX");
        return subscriptionPaymentRepository.save(payment);
    }

    @Transactional
    public void activateVerifiedProviderPayment(SubscriptionPayment payment, String providerTransactionRef,
                                                 LocalDateTime paidAt) {
        if (payment.getStatus() == PaymentStatus.PAID) return;
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment is no longer eligible for activation");
        }
        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(paidAt != null ? paidAt : LocalDateTime.now());
        payment.setProviderTransactionRef(providerTransactionRef);
        subscriptionPaymentRepository.save(payment);
        activatePlanForUser(payment.getUser(), payment.getTargetPlan(), payment.getTargetPlanVersion(),
                payment.getPaidAt(), payment);
    }

    @Transactional
    public void simulatePaymentSuccess(SimulatePaymentRequest request, String email) {
        if (!paymentGateway.isSandbox()) {
            throw new IllegalStateException("Payment simulation is disabled outside sandbox mode");
        }
        log.info("Simulating payment success for user {} and plan {}", email, request.getPlanId());

        SubscriptionPayment payment = subscriptionPaymentRepository.findWithLockByTransferContent(request.getTransferContent())
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

        activatePlanForUser(payment.getUser(), payment.getTargetPlan(), payment.getTargetPlanVersion(), payment.getPaidAt(), payment);
    }

    @Transactional
    public PaymentStatusResponse getPaymentStatus(String paymentCode, String email) {
        SubscriptionPayment payment = subscriptionPaymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        User viewer = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        boolean admin = viewer.getRole() != null && "ADMIN".equalsIgnoreCase(viewer.getRole().getRoleName());
        if (!admin && !Objects.equals(payment.getUser().getEmail(), email)) {
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

        SubscriptionPayment payment = subscriptionPaymentRepository.findWithLockByTransferContent(request.getTransferContent())
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));

        if (payment.getStatus() == PaymentStatus.PAID) {
            log.info("Payment {} already processed", payment.getPaymentCode());
            return;
        }

        if (request.getAmount().compareTo(payment.getAmount()) != 0) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Payment amount mismatch");
            subscriptionPaymentRepository.save(payment);
            throw new IllegalArgumentException("Payment amount does not match the order amount");
        }

        if (request.getTransactionReference() == null || request.getTransactionReference().isBlank()) {
            throw new IllegalArgumentException("Provider transaction ID is required");
        }

        subscriptionPaymentRepository.findByProviderTransactionRef(request.getTransactionReference())
                .filter(existing -> !Objects.equals(existing.getId(), payment.getId()))
                .ifPresent(existing -> { throw new IllegalArgumentException("Provider transaction ID was already used"); });

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

        activatePlanForUser(payment.getUser(), payment.getTargetPlan(), payment.getTargetPlanVersion(), payment.getPaidAt(), payment);
    }

    @Transactional
    public PaymentStatusResponse processSandboxPayment(String paymentCode, String token, String outcome) {
        paymentGateway.verifyCheckoutToken(paymentCode, token);

        SubscriptionPayment payment = subscriptionPaymentRepository.findWithLockByPaymentCode(paymentCode)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        if (payment.getStatus() != PaymentStatus.PENDING) return mapPaymentStatus(payment);

        String normalized = outcome.toUpperCase();
        if ("SUCCESS".equals(normalized)) {
            if (isExpired(payment)) {
                payment.setStatus(PaymentStatus.EXPIRED);
            } else {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaidAt(LocalDateTime.now());
                payment.setProviderName("STUDYHUB_SANDBOX");
                payment.setProviderTransactionRef("SANDBOX-" + payment.getPaymentCode());
                subscriptionPaymentRepository.save(payment);
                activatePlanForUser(payment.getUser(), payment.getTargetPlan(), payment.getTargetPlanVersion(), payment.getPaidAt(), payment);
                return mapPaymentStatus(payment);
            }
        } else if ("FAILED".equals(normalized)) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Sandbox failure requested by tester");
        } else if ("CANCELLED".equals(normalized)) {
            payment.setStatus(PaymentStatus.CANCELLED);
        } else if ("EXPIRED".equals(normalized)) {
            payment.setStatus(PaymentStatus.EXPIRED);
        } else {
            throw new IllegalArgumentException("Unsupported sandbox outcome");
        }
        subscriptionPaymentRepository.save(payment);
        return mapPaymentStatus(payment);
    }

    @Transactional(readOnly = true)
    public List<BillingHistoryResponse> getBillingHistory(String email) {
        log.info("Fetching billing history for user {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return subscriptionPaymentRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .filter(payment -> payment.getStatus() != PaymentStatus.PENDING)
                .map(payment -> BillingHistoryResponse.builder()
                        .planName(payment.getTargetPlanVersion() != null
                                ? payment.getTargetPlanVersion().getPlanName()
                                : payment.getTargetPlan().getPlanName())
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

    private BigDecimal validateUpgradeFlow(BigDecimal currentPrice, SubscriptionPlan targetPlan, SubscriptionPlanVersion targetVersion) {
        currentPrice = currentPrice != null ? currentPrice : BigDecimal.ZERO;
        BigDecimal targetPrice = targetVersion.getPrice();

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
            SubscriptionPlanVersion currentVersion,
            SubscriptionPlan targetPlan,
            SubscriptionPlanVersion targetVersion,
            UserSubscription currentSubscription,
            LocalDateTime upgradeDate
    ) {
        BigDecimal currentPrice = currentVersion != null
                ? currentVersion.getPrice()
                : currentPlan != null ? currentPlan.getPrice() : BigDecimal.ZERO;
        BigDecimal targetPrice = validateUpgradeFlow(currentPrice, targetPlan, targetVersion);

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

        BigDecimal remainingValue = currentPrice
                .multiply(BigDecimal.valueOf(remainingDays))
                .divide(BigDecimal.valueOf(billingCycleDays), 0, RoundingMode.HALF_UP);
        return targetPrice.subtract(remainingValue).max(BigDecimal.ZERO).setScale(0, RoundingMode.HALF_UP);
    }

    private SubscriptionPayment createPendingPayment(
            User user,
            SubscriptionPlan currentPlan,
            SubscriptionPlanVersion currentVersion,
            SubscriptionPlan targetPlan,
            SubscriptionPlanVersion targetVersion,
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
                .currentPlanVersion(currentVersion)
                .targetPlanVersion(targetVersion)
                .paymentCode(paymentCode)
                .transferContent(transferContent)
                .amount(amountDue)
                .originalAmount(targetVersion.getPrice())
                .remainingValue(quote.creditApplied())
                .discountAmount(quote.creditApplied())
                .currency("VND")
                .idempotencyKey(paymentCode)
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
            SubscriptionPlanVersion targetVersion,
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
                && targetVersion.getPrice().compareTo(
                        payment.getCurrentPlanVersion() != null
                                ? payment.getCurrentPlanVersion().getPrice()
                                : payment.getCurrentPlan().getPrice()) > 0;

        user.setPlan(targetPlan);
        userRepository.save(user);

        if (preserveCurrentCycle) {
            for (UserSubscription sub : activeSubs) {
                if (!Objects.equals(sub.getId(), activeSubscription.getId())) {
                    sub.setIsActive(false);
                    userSubscriptionRepository.save(sub);
                }
            }

            activeSubscription.setPlan(targetPlan);
            activeSubscription.setPlanVersion(targetVersion);
            activeSubscription.setPayment(payment);
            activeSubscription.setPricePaid(payment.getAmount());
            activeSubscription.setIsActive(true);
            userSubscriptionRepository.save(activeSubscription);
            refreshStorageStatusFromEntitlements(user);
            recordSubscriptionActivation(user, targetPlan, targetVersion, payment);
            notifyPlanUpgrade(user, targetPlan, activeSubscription.getEndDate());
            return;
        }

        for (UserSubscription sub : activeSubs) {
            sub.setIsActive(false);
            userSubscriptionRepository.save(sub);
        }

        LocalDateTime startDate = paymentSuccessTime;
        LocalDateTime endDate = paymentSuccessTime.plusDays(
                targetVersion.getDurationDays() != null ? targetVersion.getDurationDays() : 30L);

        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .plan(targetPlan)
                .planVersion(targetVersion)
                .payment(payment)
                .pricePaid(payment.getAmount())
                .startDate(startDate)
                .endDate(endDate)
                .isActive(true)
                .build();

        userSubscriptionRepository.save(newSub);
        refreshStorageStatusFromEntitlements(user);
        recordSubscriptionActivation(user, targetPlan, targetVersion, payment);
        notifyPlanUpgrade(user, targetPlan, newSub.getEndDate());
    }

    private void refreshStorageStatusFromEntitlements(User user) {
        UserQuotaService.StorageQuotaSnapshot quota = userQuotaService.getStorageQuotaSnapshot(user);
        user.setStorageStatus(quota.storageStatus());
        userRepository.save(user);
    }

    private void recordSubscriptionActivation(
            User user,
            SubscriptionPlan targetPlan,
            SubscriptionPlanVersion targetVersion,
            SubscriptionPayment payment
    ) {
        activityLogRepository.save(ActivityLog.builder()
                .user(user)
                .actionType("SUBSCRIPTION_ACTIVATED")
                .entityType("SUBSCRIPTION_PAYMENT")
                .entityId(payment.getId())
                .description("Activated " + targetPlan.getPlanName() + " version " + targetVersion.getVersionNumber())
                .build());
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
                .planName(payment.getTargetPlanVersion() != null
                        ? payment.getTargetPlanVersion().getPlanName()
                        : payment.getTargetPlan().getPlanName())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(status)
                .transferContent(payment.getTransferContent())
                .createdAt(payment.getCreatedAt())
                .expiresAt(payment.getExpiresAt())
                .paidAt(payment.getPaidAt())
                .transactionId(payment.getVnpTransactionNo() != null
                        ? payment.getVnpTransactionNo() : payment.getProviderTransactionRef())
                .subscriptionActivated(userSubscriptionRepository.existsByPayment_Id(payment.getId()))
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

    private SubscriptionPlanVersion getLatestPlanVersion(SubscriptionPlan plan) {
        return planVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(plan.getId())
                .orElseGet(() -> createPlanVersion(plan));
    }

    private SubscriptionPlanVersion createPlanVersion(SubscriptionPlan plan) {
        int nextVersion = planVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(plan.getId())
                .map(version -> version.getVersionNumber() + 1)
                .orElse(1);
        return planVersionRepository.save(SubscriptionPlanVersion.builder()
                .plan(plan)
                .versionNumber(nextVersion)
                .planName(plan.getPlanName())
                .description(plan.getDescription())
                .price(plan.getPrice())
                .storageLimitMb(plan.getStorageLimitMb())
                .aiRequestsPerDay(plan.getAiRequestsPerDay())
                .downloadLimit(plan.getDownloadLimit())
                .bookmarkLimit(plan.getBookmarkLimit())
                .durationDays(plan.getDurationDays())
                .canUseAiSummary(plan.getCanUseAiSummary())
                .canUseFlashcards(plan.getCanUseFlashcards())
                .canUseQuizzes(plan.getCanUseQuizzes())
                .canPublishDocuments(plan.getCanPublishDocuments())
                .canPublishFolders(plan.getCanPublishFolders())
                .effectiveFrom(LocalDateTime.now())
                .build());
    }

    @Transactional(readOnly = true)
    public CurrentSubscriptionResponse getCurrentSubscription(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        SubscriptionEntitlementService.ActiveEntitlements active = entitlementService.getActiveEntitlements(user);
        SubscriptionEntitlementService.PlanBenefits benefits = active.benefits();
        UserSubscription subscription = active.subscription();
        return CurrentSubscriptionResponse.builder()
                .subscriptionId(subscription != null ? subscription.getId() : null)
                .planName(benefits.planName())
                .planId(benefits.planId())
                .planVersionId(benefits.versionId())
                .planVersionNumber(benefits.versionNumber())
                .price(benefits.price())
                .startDate(subscription != null ? subscription.getStartDate() : null)
                .endDate(subscription != null ? subscription.getEndDate() : null)
                .autoRenew(subscription != null && Boolean.TRUE.equals(subscription.getAutoRenew()))
                .storageLimitMb(benefits.storageLimitMb())
                .aiRequestsPerDay(benefits.aiRequestsPerDay())
                .downloadLimit(benefits.downloadLimit())
                .bookmarkLimit(benefits.bookmarkLimit())
                .canUseAiSummary(benefits.canUseAiSummary())
                .canUseFlashcards(benefits.canUseFlashcards())
                .canUseQuizzes(benefits.canUseQuizzes())
                .canPublishDocuments(benefits.canPublishDocuments())
                .canPublishFolders(benefits.canPublishFolders())
                .upcomingVersion(mapVersion(active.upcomingVersion()))
                .build();
    }

    @Transactional(readOnly = true)
    public List<SubscriptionPlanVersionResponse> getPlanVersions(Long planId) {
        if (!subscriptionPlanRepository.existsById(planId)) {
            throw new IllegalArgumentException("Subscription plan not found");
        }
        return planVersionRepository.findByPlan_IdOrderByVersionNumberDesc(planId).stream()
                .map(this::mapVersion)
                .toList();
    }

    private SubscriptionPlanVersionResponse mapVersion(SubscriptionPlanVersion version) {
        if (version == null) return null;
        return SubscriptionPlanVersionResponse.builder()
                .id(version.getId()).planId(version.getPlan().getId()).versionNumber(version.getVersionNumber())
                .planName(version.getPlanName()).description(version.getDescription())
                .price(version.getPrice()).storageLimitMb(version.getStorageLimitMb())
                .aiRequestsPerDay(version.getAiRequestsPerDay()).downloadLimit(version.getDownloadLimit())
                .bookmarkLimit(version.getBookmarkLimit()).durationDays(version.getDurationDays())
                .canUseAiSummary(version.getCanUseAiSummary()).canUseFlashcards(version.getCanUseFlashcards())
                .canUseQuizzes(version.getCanUseQuizzes()).canPublishDocuments(version.getCanPublishDocuments())
                .canPublishFolders(version.getCanPublishFolders()).effectiveFrom(version.getEffectiveFrom())
                .createdAt(version.getCreatedAt()).build();
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
            log.error("Rejected payment webhook because PAYMENT_WEBHOOK_SECRET is not configured");
            throw new IllegalStateException("Payment webhook is not configured");
        }

        if (secretHeader == null || !MessageDigest.isEqual(
                webhookSecret.getBytes(StandardCharsets.UTF_8),
                secretHeader.getBytes(StandardCharsets.UTF_8))) {
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
                .downloadLimit(request.getDownloadLimit())
                .bookmarkLimit(request.getBookmarkLimit())
                .durationDays(request.getDurationDays())
                .canUseAiSummary(request.getCanUseAiSummary())
                .canUseFlashcards(request.getCanUseFlashcards())
                .canUseQuizzes(request.getCanUseQuizzes())
                .canPublishDocuments(request.getCanPublishDocuments())
                .canPublishFolders(request.getCanPublishFolders())
                .isActive(request.getIsActive())
                .build();
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        createPlanVersion(saved);
        return saved;
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
        plan.setDownloadLimit(request.getDownloadLimit());
        plan.setBookmarkLimit(request.getBookmarkLimit());
        plan.setDurationDays(request.getDurationDays());
        plan.setCanUseAiSummary(request.getCanUseAiSummary());
        plan.setCanUseFlashcards(request.getCanUseFlashcards());
        plan.setCanUseQuizzes(request.getCanUseQuizzes());
        plan.setCanPublishDocuments(request.getCanPublishDocuments());
        plan.setCanPublishFolders(request.getCanPublishFolders());
        plan.setIsActive(request.getIsActive());
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        createPlanVersion(saved);
        return saved;
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!subscriptionPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Subscription plan not found");
        }
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));
        plan.setIsActive(false);
        subscriptionPlanRepository.save(plan);
    }
}
