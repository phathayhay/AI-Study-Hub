package com.studyhub.user.service;

import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.common.AiQuotaExceededException;
import com.studyhub.common.StorageQuotaExceededException;
import com.studyhub.common.enums.SenderType;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.ActivityLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserQuotaServiceImplTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private SubscriptionEntitlementService entitlementService;

    @InjectMocks
    private UserQuotaServiceImpl userQuotaService;

    private User user;
    private SubscriptionPlan freePlan;

    @BeforeEach
    void setUp() {
        freePlan = SubscriptionPlan.builder()
                .id(1L)
                .planName("FREE")
                .storageLimitMb(5L) // 5MB
                .aiRequestsPerDay(5)
                .build();

        user = User.builder()
                .id(100L)
                .email("student@fpt.edu.vn")
                .plan(freePlan)
                .storageStatus(StorageStatus.NORMAL)
                .build();

        SubscriptionEntitlementService.PlanBenefits benefits = SubscriptionEntitlementService.PlanBenefits.fromPlan(freePlan);
        lenient().when(entitlementService.getActiveEntitlements(user))
                .thenReturn(new SubscriptionEntitlementService.ActiveEntitlements(null, benefits, null));
    }

    @Test
    void getStorageQuotaSnapshot_ShouldReturnCorrectCalculations() {
        // Arrange
        when(documentRepository.sumFileSizeByUserId(user.getId())).thenReturn(2L * 1024 * 1024); // 2MB used

        // Act
        UserQuotaService.StorageQuotaSnapshot snapshot = userQuotaService.getStorageQuotaSnapshot(user);

        // Assert
        assertNotNull(snapshot);
        assertEquals(5L, snapshot.storageLimitMb());
        assertEquals(2L * 1024 * 1024, snapshot.storageUsedBytes());
        assertEquals(2.0, snapshot.storageUsedMb());
        assertEquals(StorageStatus.NORMAL, snapshot.storageStatus());
        assertTrue(snapshot.canUpload());
    }

    @Test
    void validateUploadAllowed_WhenQuotaExceeded_ShouldThrowException() {
        // Arrange
        when(documentRepository.sumFileSizeByUserId(user.getId())).thenReturn(6L * 1024 * 1024); // 6MB used (over 5MB limit)

        // Act & Assert
        assertThrows(StorageQuotaExceededException.class, () -> {
            userQuotaService.validateUploadAllowed(user, 1024);
        });
    }

    @Test
    void validateUploadAllowed_WhenIncomingFileExceedsLimit_ShouldThrowException() {
        // Arrange
        when(documentRepository.sumFileSizeByUserId(user.getId())).thenReturn(4L * 1024 * 1024); // 4MB used

        // Act & Assert
        assertThrows(StorageQuotaExceededException.class, () -> {
            userQuotaService.validateUploadAllowed(user, 2L * 1024 * 1024); // +2MB = 6MB (over 5MB limit)
        });
    }

    @Test
    void hasRemainingAiRequests_WhenUnderLimit_ShouldReturnTrue() {
        // Arrange
        when(chatMessageRepository.countByUserIdAndSenderTypeBetween(any(), eq(SenderType.AI), any(), any())).thenReturn(3L);

        // Act
        boolean hasRemaining = userQuotaService.hasRemainingAiRequests(user);

        // Assert
        assertTrue(hasRemaining);
    }

    @Test
    void hasRemainingAiRequests_WhenLimitReached_ShouldReturnFalse() {
        // Arrange
        when(chatMessageRepository.countByUserIdAndSenderTypeBetween(any(), eq(SenderType.AI), any(), any())).thenReturn(5L);

        // Act
        boolean hasRemaining = userQuotaService.hasRemainingAiRequests(user);

        // Assert
        assertFalse(hasRemaining);
    }

    @Test
    void validateAiRequestAllowed_WhenCombinedUsageReachesLimit_ShouldThrowException() {
        when(chatMessageRepository.countByUserIdAndSenderTypeBetween(any(), eq(SenderType.AI), any(), any()))
                .thenReturn(3L);
        when(activityLogRepository.countByUser_IdAndActionTypeStartingWithAndCreatedAtBetween(
                eq(user.getId()), eq("AI_"), any(), any()))
                .thenReturn(2L);

        assertThrows(AiQuotaExceededException.class, () -> userQuotaService.validateAiRequestAllowed(user));
    }
}
