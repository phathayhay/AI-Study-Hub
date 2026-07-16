package com.studyhub.user.service;

import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.user.repository.ActivityLogRepository;
import com.studyhub.common.enums.Campus;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.dto.UpdateProfileRequest;
import com.studyhub.user.dto.UserProfileResponse;
import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserSubscriptionRepository userSubscriptionRepository;

    @Mock
    private CloudinaryStorageService cloudinaryStorageService;

    @Mock
    private StudentVerificationRepository studentVerificationRepository;

    @Mock
    private MajorRepository majorRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private UserServiceImpl userService;

    private User user;
    private SubscriptionPlan freePlan;
    private Role userRole;

    @BeforeEach
    void setUp() {
        freePlan = SubscriptionPlan.builder()
                .id(1L)
                .planName("FREE")
                .storageLimitMb(100L)
                .aiRequestsPerDay(10)
                .build();

        userRole = new Role(1L, "USER");

        user = User.builder()
                .id(100L)
                .email("student@fpt.edu.vn")
                .firstName("Nguyen")
                .lastName("Van A")
                .avatarUrl("old-avatar.jpg")
                .plan(freePlan)
                .role(userRole)
                .storageStatus(StorageStatus.NORMAL)
                .verificationStatus(VerificationStatus.UNVERIFIED)
                .build();
    }

    @Test
    void getProfile_ShouldReturnValidProfileResponse() {
        // Arrange
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(studentVerificationRepository.findByUserId(user.getId())).thenReturn(Optional.empty());
        when(userSubscriptionRepository.findByUser_IdAndIsActiveTrue(user.getId())).thenReturn(Collections.emptyList());

        SubscriptionService.StorageQuotaSnapshot quotaSnapshot = new SubscriptionService.StorageQuotaSnapshot(
                100L, 104857600L, 52428800L, 50.0, StorageStatus.NORMAL, true, "Storage status normal"
        );
        when(subscriptionService.getStorageQuotaSnapshot(user)).thenReturn(quotaSnapshot);
        when(chatMessageRepository.countByUserIdAndSenderTypeBetween(any(), any(), any(), any())).thenReturn(3L);

        // Act
        UserProfileResponse response = userService.getProfile(user.getEmail());

        // Assert
        assertNotNull(response);
        assertEquals(user.getEmail(), response.getEmail());
        assertEquals("Van A Nguyen", response.getFullName());
        assertEquals("FREE", response.getPlanName());
        assertEquals(3L, response.getPlanAiRequestsUsedToday());
        assertTrue(response.getCanUpload());
        verify(userRepository, times(1)).findByEmail(user.getEmail());
    }

    @Test
    void updateProfile_ShouldUpdateDetailsCorrectly() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFirstName("Nguyen Van");
        request.setLastName("B");
        request.setCampus("HCM");
        request.setCurrentSemester("Semester 5");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionService.StorageQuotaSnapshot quotaSnapshot = new SubscriptionService.StorageQuotaSnapshot(
                100L, 104857600L, 52428800L, 50.0, StorageStatus.NORMAL, true, "Storage status normal"
        );
        when(subscriptionService.getStorageQuotaSnapshot(any(User.class))).thenReturn(quotaSnapshot);

        // Act
        UserProfileResponse response = userService.updateProfile(user.getEmail(), request);

        // Assert
        assertNotNull(response);
        assertEquals("Nguyen Van", response.getFirstName());
        assertEquals("B", response.getLastName());
        assertEquals(Campus.HCM, response.getCampus());
        assertEquals("Semester 5", response.getCurrentSemester());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void uploadAvatar_ShouldUploadNewAndCleanOld() throws IOException {
        // Arrange
        MockMultipartFile mockFile = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "some image data".getBytes());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(cloudinaryStorageService.uploadFile(mockFile, "avatars")).thenReturn("new-avatar.jpg");

        // Act
        String newUrl = userService.uploadAvatar(user.getEmail(), mockFile);

        // Assert
        assertEquals("new-avatar.jpg", newUrl);
        verify(cloudinaryStorageService, times(1)).deleteFile("old-avatar.jpg");
        verify(cloudinaryStorageService, times(1)).uploadFile(mockFile, "avatars");
        verify(userRepository, times(1)).save(user);
    }
}
