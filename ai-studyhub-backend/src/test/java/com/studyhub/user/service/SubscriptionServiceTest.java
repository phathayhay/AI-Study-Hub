package com.studyhub.user.service;

import com.studyhub.common.enums.StorageStatus;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.user.dto.*;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.SubscriptionPayment;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.entity.SubscriptionPlanVersion;
import com.studyhub.payment.PaymentGateway;
import com.studyhub.user.repository.ActivityLogRepository;
import com.studyhub.user.repository.SubscriptionPlanVersionRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPaymentRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private SubscriptionPaymentRepository subscriptionPaymentRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private UserQuotaService userQuotaService;

    @Mock
    private SubscriptionPlanVersionRepository planVersionRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private SubscriptionEntitlementService entitlementService;

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private User mockUser;
    private SubscriptionPlan freePlan;
    private SubscriptionPlan proPlan;
    private SubscriptionPlan premiumPlan;
    private SubscriptionPlanVersion freeVersion;
    private SubscriptionPlanVersion proVersion;
    private SubscriptionPlanVersion premiumVersion;

    @BeforeEach
    void setUp() {
        freePlan = SubscriptionPlan.builder()
                .id(1L)
                .planName("FREE")
                .description("Free plan")
                .price(BigDecimal.ZERO)
                .storageLimitMb(500L)
                .aiRequestsPerDay(10)
                .isActive(true)
                .build();

        proPlan = SubscriptionPlan.builder()
                .id(2L)
                .planName("PRO")
                .description("Pro plan")
                .price(BigDecimal.valueOf(29000))
                .storageLimitMb(5120L)
                .aiRequestsPerDay(100)
                .isActive(true)
                .build();

        premiumPlan = SubscriptionPlan.builder()
                .id(3L)
                .planName("PREMIUM")
                .description("Premium plan")
                .price(BigDecimal.valueOf(69000))
                .storageLimitMb(2048L)
                .aiRequestsPerDay(1000)
                .durationDays(30)
                .isActive(true)
                .build();

        mockUser = User.builder()
                .id(10L)
                .email("student@fpt.edu.vn")
                .firstName("Student")
                .lastName("FPT")
                .plan(freePlan)
                .build();

        freeVersion = version(11L, freePlan, 1);
        proVersion = version(12L, proPlan, 1);
        premiumVersion = version(13L, premiumPlan, 1);
        lenient().when(planVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(1L)).thenReturn(Optional.of(freeVersion));
        lenient().when(planVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(2L)).thenReturn(Optional.of(proVersion));
        lenient().when(planVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(3L)).thenReturn(Optional.of(premiumVersion));
        lenient().when(paymentGateway.createCheckout(any())).thenReturn(
                new PaymentGateway.CheckoutSession("http://localhost:5173/sandbox-payment", "signed-token", "STUDYHUB_SANDBOX"));
        lenient().when(paymentGateway.isSandbox()).thenReturn(true);

        ReflectionTestUtils.setField(subscriptionService, "paymentBankName", "TPBank");
        ReflectionTestUtils.setField(subscriptionService, "paymentAccountName", "CONG TY AI STUDYHUB FPT");
        ReflectionTestUtils.setField(subscriptionService, "paymentAccountNumber", "00004103937");
        ReflectionTestUtils.setField(subscriptionService, "paymentProviderName", "BANK_TRANSFER");
        ReflectionTestUtils.setField(subscriptionService, "paymentOrderExpiryMinutes", 30L);
        ReflectionTestUtils.setField(subscriptionService, "webhookSecret", "verified-webhook-secret");
    }

    private SubscriptionPlanVersion version(Long id, SubscriptionPlan plan, int number) {
        return SubscriptionPlanVersion.builder()
                .id(id).plan(plan).versionNumber(number).planName(plan.getPlanName()).description(plan.getDescription()).price(plan.getPrice())
                .storageLimitMb(plan.getStorageLimitMb()).aiRequestsPerDay(plan.getAiRequestsPerDay())
                .downloadLimit(0).bookmarkLimit(0).durationDays(plan.getDurationDays() != null ? plan.getDurationDays() : 30)
                .canUseAiSummary(true).canUseFlashcards(true).canUseQuizzes(true)
                .canPublishDocuments(true).canPublishFolders(true).build();
    }

    @Test
    void testGetActivePlans() {
        when(subscriptionPlanRepository.findAll()).thenReturn(List.of(freePlan, proPlan));

        List<SubscriptionPlanResponse> response = subscriptionService.getActivePlans();

        assertNotNull(response);
        assertEquals(2, response.size());
        assertEquals("FREE", response.get(0).getPlanName());
        assertEquals("PRO", response.get(1).getPlanName());
    }

    @Test
    void testGetUpgradePaymentInfo_Success() {
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(subscriptionPlanRepository.findById(2L)).thenReturn(Optional.of(proPlan));
        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(10L)).thenReturn(List.of());
        when(subscriptionPaymentRepository.findFirstByUser_IdAndTargetPlan_IdAndStatusOrderByCreatedAtDesc(eq(10L), eq(2L), any()))
                .thenReturn(Optional.empty());
        when(subscriptionPaymentRepository.save(any(SubscriptionPayment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpgradePaymentResponse response = subscriptionService.getUpgradePaymentInfo(2L, "student@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(2L, response.getPlanId());
        assertEquals("PRO", response.getPlanName());
        assertEquals(BigDecimal.valueOf(29000), response.getAmount());
        assertEquals("TPBank", response.getBankName());
        assertEquals("00004103937", response.getAccountNumber());
        assertEquals(0L, response.getRemainingDays());
        assertTrue(response.getQrCodeUrl().contains("https://img.vietqr.io/image/TPB-00004103937-compact2.png"));
    }

    @Test
    void testGetUpgradePaymentInfo_ProToPremiumProratedAmount() {
        mockUser.setPlan(proPlan);
        UserSubscription activeProSubscription = UserSubscription.builder()
                .id(501L)
                .user(mockUser)
                .plan(proPlan)
                .planVersion(proVersion)
                .startDate(LocalDateTime.now().minusDays(25))
                .endDate(LocalDateTime.now().plusDays(5))
                .isActive(true)
                .build();

        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(subscriptionPlanRepository.findById(3L)).thenReturn(Optional.of(premiumPlan));
        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(10L)).thenReturn(List.of(activeProSubscription));
        when(subscriptionPaymentRepository.findFirstByUser_IdAndTargetPlan_IdAndStatusOrderByCreatedAtDesc(eq(10L), eq(3L), eq(com.studyhub.common.enums.PaymentStatus.PENDING)))
                .thenReturn(Optional.empty());
        when(subscriptionPaymentRepository.save(any(SubscriptionPayment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpgradePaymentResponse response = subscriptionService.getUpgradePaymentInfo(3L, "student@fpt.edu.vn");

        assertEquals(BigDecimal.valueOf(64167), response.getAmount());
        assertEquals(5L, response.getRemainingDays());
        assertEquals(30L, response.getBillingCycleDays());
        assertNotNull(response.getCurrentPeriodEndDate());
    }

    @Test
    void testGetUpgradePaymentInfo_UpgradeToFreeThrowsException() {
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(subscriptionPlanRepository.findById(1L)).thenReturn(Optional.of(freePlan));
        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(10L)).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> {
            subscriptionService.getUpgradePaymentInfo(1L, "student@fpt.edu.vn");
        });
    }

    @Test
    void testSimulatePaymentSuccess() {
        SimulatePaymentRequest request = SimulatePaymentRequest.builder()
                .planId(2L)
                .transferContent("SHU10P2DEMO")
                .build();

        SubscriptionPayment pendingPayment = SubscriptionPayment.builder()
                .id(900L)
                .user(mockUser)
                .currentPlan(freePlan)
                .targetPlan(proPlan)
                .targetPlanVersion(proVersion)
                .transferContent("SHU10P2DEMO")
                .paymentCode("SHU10P2DEMO")
                .amount(BigDecimal.valueOf(29000))
                .status(com.studyhub.common.enums.PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build();

        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(10L))
                .thenReturn(List.of());
        when(subscriptionPaymentRepository.findWithLockByTransferContent("SHU10P2DEMO"))
                .thenReturn(Optional.of(pendingPayment));
        when(subscriptionPaymentRepository.save(any(SubscriptionPayment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userQuotaService.getStorageQuotaSnapshot(mockUser)).thenReturn(
                new UserQuotaService.StorageQuotaSnapshot(5120L, 5120L * 1024L * 1024L, 0L, 0d, StorageStatus.NORMAL, true, null));

        subscriptionService.simulatePaymentSuccess(request, "student@fpt.edu.vn");

        assertEquals(proPlan, mockUser.getPlan());
        assertEquals(com.studyhub.common.enums.PaymentStatus.PAID, pendingPayment.getStatus());
        verify(userRepository, atLeastOnce()).save(mockUser);
        verify(subscriptionPaymentRepository, atLeastOnce()).save(pendingPayment);
        verify(userSubscriptionRepository, times(1)).save(argThat(sub ->
            sub.getPlan().equals(proPlan) && sub.getUser().equals(mockUser) && sub.getIsActive()
        ));
    }

    @Test
    void sandboxFailedPayment_DoesNotActivatePlan() {
        SubscriptionPayment payment = pendingPayment();
        when(subscriptionPaymentRepository.findWithLockByPaymentCode(payment.getPaymentCode()))
                .thenReturn(Optional.of(payment));
        when(subscriptionPaymentRepository.save(any(SubscriptionPayment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        PaymentStatusResponse response = subscriptionService.processSandboxPayment(
                payment.getPaymentCode(), "signed-token", "FAILED");

        assertEquals(com.studyhub.common.enums.PaymentStatus.FAILED, response.getStatus());
        assertEquals(freePlan, mockUser.getPlan());
        verify(paymentGateway).verifyCheckoutToken(payment.getPaymentCode(), "signed-token");
        verify(userSubscriptionRepository).existsByPayment_Id(payment.getId());
        verify(userSubscriptionRepository, never()).save(any(UserSubscription.class));
    }

    @Test
    void duplicateSandboxSuccess_ActivatesSubscriptionOnlyOnce() {
        SubscriptionPayment payment = pendingPayment();
        when(subscriptionPaymentRepository.findWithLockByPaymentCode(payment.getPaymentCode()))
                .thenReturn(Optional.of(payment));
        when(subscriptionPaymentRepository.save(any(SubscriptionPayment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(mockUser.getId())).thenReturn(List.of());
        when(userQuotaService.getStorageQuotaSnapshot(mockUser)).thenReturn(
                new UserQuotaService.StorageQuotaSnapshot(5120L, 5120L * 1024L * 1024L, 0L, 0d, StorageStatus.NORMAL, true, null));

        PaymentStatusResponse first = subscriptionService.processSandboxPayment(
                payment.getPaymentCode(), "signed-token", "SUCCESS");
        PaymentStatusResponse duplicate = subscriptionService.processSandboxPayment(
                payment.getPaymentCode(), "signed-token", "SUCCESS");

        assertEquals(com.studyhub.common.enums.PaymentStatus.PAID, first.getStatus());
        assertEquals(com.studyhub.common.enums.PaymentStatus.PAID, duplicate.getStatus());
        verify(userSubscriptionRepository, times(1)).save(any(UserSubscription.class));
    }

    @Test
    void webhookWithInvalidSignature_IsRejectedBeforePaymentLookup() {
        PaymentWebhookRequest request = PaymentWebhookRequest.builder()
                .transferContent("SHU10P2SIGNED").amount(BigDecimal.valueOf(29000))
                .transactionReference("TX-100").build();

        assertThrows(IllegalArgumentException.class,
                () -> subscriptionService.processPaymentWebhook(request, "wrong-secret"));
        verify(subscriptionPaymentRepository, never()).findWithLockByTransferContent(anyString());
    }

    @Test
    void webhookWithIncorrectAmount_IsRejectedWithoutActivation() {
        SubscriptionPayment payment = pendingPayment();
        PaymentWebhookRequest request = PaymentWebhookRequest.builder()
                .transferContent(payment.getTransferContent()).amount(BigDecimal.ONE)
                .transactionReference("TX-101").build();
        when(subscriptionPaymentRepository.findWithLockByTransferContent(payment.getTransferContent()))
                .thenReturn(Optional.of(payment));

        assertThrows(IllegalArgumentException.class,
                () -> subscriptionService.processPaymentWebhook(request, "verified-webhook-secret"));
        assertEquals(com.studyhub.common.enums.PaymentStatus.FAILED, payment.getStatus());
        verifyNoInteractions(userSubscriptionRepository);
    }

    private SubscriptionPayment pendingPayment() {
        return SubscriptionPayment.builder()
                .id(901L).user(mockUser).currentPlan(freePlan).targetPlan(proPlan)
                .currentPlanVersion(freeVersion).targetPlanVersion(proVersion)
                .paymentCode("SHU10P2SIGNED").transferContent("SHU10P2SIGNED")
                .amount(BigDecimal.valueOf(29000)).originalAmount(BigDecimal.valueOf(29000))
                .idempotencyKey("SHU10P2SIGNED")
                .bankName("TPBank").accountName("AI Study Hub").accountNumber("00004103937")
                .status(com.studyhub.common.enums.PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusMinutes(30)).build();
    }

    @Test
    void testGetBillingHistory() {
        SubscriptionPayment historyRecord = SubscriptionPayment.builder()
                .id(101L)
                .user(mockUser)
                .targetPlan(proPlan)
                .amount(BigDecimal.valueOf(29000))
                .status(com.studyhub.common.enums.PaymentStatus.PAID)
                .paymentCode("PAID-101")
                .transferContent("SHU10P2PAID")
                .bankName("TPBank")
                .accountName("AI Study Hub")
                .accountNumber("00004103937")
                .paidAt(LocalDateTime.now())
                .build();

        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(subscriptionPaymentRepository.findByUser_IdOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(historyRecord));

        List<BillingHistoryResponse> response = subscriptionService.getBillingHistory("student@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("PRO", response.get(0).getPlanName());
        assertTrue(response.get(0).getIsActive());
    }

    @Test
    void testHandleExpiredSubscription_MarksUserOverQuotaWithoutDeletingData() {
        mockUser.setPlan(proPlan);
        mockUser.setStorageStatus(StorageStatus.NORMAL);
        freePlan.setStorageLimitMb(50L);
        UserSubscription expiredSubscription = UserSubscription.builder()
                .id(301L)
                .user(mockUser)
                .plan(proPlan)
                .startDate(LocalDateTime.now().minusDays(30))
                .endDate(LocalDateTime.now().minusMinutes(5))
                .isActive(true)
                .build();

        when(subscriptionPlanRepository.findByPlanName("FREE")).thenReturn(Optional.of(freePlan));
        when(userSubscriptionRepository.findByIsActiveTrueAndEndDateBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(expiredSubscription));
        when(userQuotaService.getStorageQuotaSnapshot(mockUser)).thenReturn(
                new UserQuotaService.StorageQuotaSnapshot(
                        50L,
                        50L * 1024L * 1024L,
                        800L * 1024L * 1024L,
                        800d,
                        StorageStatus.OVER_QUOTA,
                        false,
                        "Storage limit exceeded"
                )
        );

        subscriptionService.checkExpiredSubscriptions();

        assertEquals(freePlan, mockUser.getPlan());
        assertEquals(StorageStatus.OVER_QUOTA, mockUser.getStorageStatus());
        assertFalse(expiredSubscription.getIsActive());
        verify(userSubscriptionRepository).save(expiredSubscription);
        verify(userRepository).save(mockUser);
        verify(notificationService).createNotification(eq(mockUser), eq("Subscription expired"), contains("returned to FREE"), any());
    }

    @Test
    void testSyncStorageStatus_ReturnsNormalWhenUsageFallsWithinLimit() {
        mockUser.setPlan(freePlan);
        mockUser.setStorageStatus(StorageStatus.OVER_QUOTA);
        freePlan.setStorageLimitMb(50L);
        when(documentRepository.sumFileSizeByUserId(10L)).thenReturn(40L * 1024L * 1024L);

        SubscriptionService.StorageQuotaSnapshot snapshot = subscriptionService.syncStorageStatus(mockUser, freePlan);

        assertEquals(StorageStatus.NORMAL, mockUser.getStorageStatus());
        assertFalse(snapshot.overQuota());
        assertTrue(snapshot.canUpload());
        assertNull(snapshot.message());
    }
}
