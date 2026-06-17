package com.studyhub.user.service;

import com.studyhub.user.dto.*;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private SubscriptionService subscriptionService;

    private User mockUser;
    private SubscriptionPlan freePlan;
    private SubscriptionPlan proPlan;

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
                .price(BigDecimal.valueOf(99000))
                .storageLimitMb(5120L)
                .aiRequestsPerDay(100)
                .isActive(true)
                .build();

        mockUser = User.builder()
                .id(10L)
                .email("student@fpt.edu.vn")
                .fullName("FPT Student")
                .plan(freePlan)
                .build();
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

        UpgradePaymentResponse response = subscriptionService.getUpgradePaymentInfo(2L, "student@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(2L, response.getPlanId());
        assertEquals("PRO", response.getPlanName());
        assertEquals(BigDecimal.valueOf(99000), response.getAmount());
        assertEquals("MB", response.getBankName());
        assertEquals("1234567890", response.getAccountNumber());
        assertTrue(response.getTransferContent().contains("SHUPGRADE"));
        assertTrue(response.getQrCodeUrl().contains("https://img.vietqr.io/image/MB-1234567890-compact2.png"));
    }

    @Test
    void testGetUpgradePaymentInfo_UpgradeToFreeThrowsException() {
        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(subscriptionPlanRepository.findById(1L)).thenReturn(Optional.of(freePlan));

        assertThrows(IllegalArgumentException.class, () -> {
            subscriptionService.getUpgradePaymentInfo(1L, "student@fpt.edu.vn");
        });
    }

    @Test
    void testSimulatePaymentSuccess() {
        SimulatePaymentRequest request = SimulatePaymentRequest.builder()
                .planId(2L)
                .transferContent("SHUPGRADE 10 2 1234")
                .build();

        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(mockUser));
        when(subscriptionPlanRepository.findById(2L)).thenReturn(Optional.of(proPlan));

        UserSubscription oldSub = UserSubscription.builder()
                .id(100L)
                .user(mockUser)
                .plan(freePlan)
                .isActive(true)
                .build();

        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(10L))
                .thenReturn(List.of(oldSub));

        subscriptionService.simulatePaymentSuccess(request, "student@fpt.edu.vn");

        // Verify old subscription is deactivated
        assertFalse(oldSub.getIsActive());
        verify(userSubscriptionRepository, times(1)).save(oldSub);

        // Verify user plan is updated to PRO
        assertEquals(proPlan, mockUser.getPlan());
        verify(userRepository, times(1)).save(mockUser);

        // Verify new subscription is saved
        verify(userSubscriptionRepository, times(1)).save(argThat(sub -> 
            sub.getPlan().equals(proPlan) && sub.getUser().equals(mockUser) && sub.getIsActive()
        ));
    }

    @Test
    void testGetBillingHistory() {
        UserSubscription historyRecord = UserSubscription.builder()
                .id(101L)
                .user(mockUser)
                .plan(proPlan)
                .startDate(LocalDateTime.now())
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .build();

        when(userSubscriptionRepository.findByUser_EmailOrderByCreatedAtDesc("student@fpt.edu.vn"))
                .thenReturn(List.of(historyRecord));

        List<BillingHistoryResponse> response = subscriptionService.getBillingHistory("student@fpt.edu.vn");

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("PRO", response.get(0).getPlanName());
        assertTrue(response.get(0).getIsActive());
    }
}
