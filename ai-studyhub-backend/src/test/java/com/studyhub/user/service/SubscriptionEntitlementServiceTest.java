package com.studyhub.user.service;

import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.SubscriptionPlanVersion;
import com.studyhub.user.entity.User;
import com.studyhub.user.entity.UserSubscription;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPlanVersionRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionEntitlementServiceTest {

    @Mock UserSubscriptionRepository subscriptionRepository;
    @Mock SubscriptionPlanRepository planRepository;
    @Mock SubscriptionPlanVersionRepository versionRepository;
    @InjectMocks SubscriptionEntitlementService service;

    @Test
    void activeSubscriberKeepsPurchasedVersionAndSeesUpcomingVersion() {
        SubscriptionPlan plan = SubscriptionPlan.builder().id(2L).planName("PRO").build();
        SubscriptionPlanVersion purchased = version(20L, plan, 1, 500L, 100);
        SubscriptionPlanVersion latest = version(21L, plan, 2, 1024L, 200);
        User user = User.builder().id(10L).plan(plan).build();
        UserSubscription subscription = UserSubscription.builder()
                .id(30L).user(user).plan(plan).planVersion(purchased)
                .endDate(LocalDateTime.now().plusDays(10)).isActive(true).build();

        when(subscriptionRepository.findByUser_IdAndIsActiveTrue(10L)).thenReturn(List.of(subscription));
        when(versionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(2L)).thenReturn(Optional.of(latest));

        SubscriptionEntitlementService.ActiveEntitlements result = service.getActiveEntitlements(user);

        assertEquals(500L, result.benefits().storageLimitMb());
        assertEquals(100, result.benefits().aiRequestsPerDay());
        assertEquals(2, result.upcomingVersion().getVersionNumber());
    }

    private SubscriptionPlanVersion version(Long id, SubscriptionPlan plan, int number, long storage, int aiLimit) {
        return SubscriptionPlanVersion.builder()
                .id(id).plan(plan).versionNumber(number).planName(plan.getPlanName()).price(BigDecimal.valueOf(29000))
                .storageLimitMb(storage).aiRequestsPerDay(aiLimit).downloadLimit(50).bookmarkLimit(50)
                .durationDays(30).canUseAiSummary(true).canUseFlashcards(true).canUseQuizzes(true)
                .canPublishDocuments(true).canPublishFolders(true).build();
    }
}
