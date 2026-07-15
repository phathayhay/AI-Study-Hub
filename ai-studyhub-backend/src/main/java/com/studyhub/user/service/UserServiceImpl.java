package com.studyhub.user.service;

import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.common.enums.SenderType;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.common.enums.Campus;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.dto.UpdateProfileRequest;
import com.studyhub.user.dto.UserProfileResponse;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final CloudinaryStorageService cloudinaryStorageService;
    private final StudentVerificationRepository studentVerificationRepository;
    private final MajorRepository majorRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SubscriptionService subscriptionService;

    @Override
    @Transactional
    public String uploadAvatar(String email, MultipartFile file) throws IOException {
        log.info("Service: Uploading avatar for user {}", email);

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Xóa ảnh đại diện cũ trên Cloudinary nếu có
        String oldAvatarUrl = user.getAvatarUrl();
        if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
            try {
                cloudinaryStorageService.deleteFile(oldAvatarUrl);
            } catch (Exception e) {
                log.warn("Failed to delete old avatar file on Cloudinary for user {}: {}", email, e.getMessage());
            }
        }

        // Tải ảnh đại diện mới lên Cloudinary
        String newAvatarUrl = cloudinaryStorageService.uploadFile(file, "avatars");

        // Cập nhật đường dẫn ảnh mới vào Database
        user.setAvatarUrl(newAvatarUrl);
        userRepository.save(user);

        return newAvatarUrl;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        log.info("Service: Retrieving profile for user {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return buildUserProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        log.info("Service: Updating profile for user {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());

        if (request.getCampus() != null && !request.getCampus().isBlank()) {
            try {
                user.setCampus(Campus.valueOf(request.getCampus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid campus code: " + request.getCampus());
            }
        }

        if (request.getMajorId() != null) {
            Major major = majorRepository.findById(request.getMajorId())
                    .orElseThrow(() -> new IllegalArgumentException("Major not found"));
            user.setMajor(major);
        } else {
            user.setMajor(null);
        }

        user.setCurrentSemester(request.getCurrentSemester());

        User savedUser = userRepository.save(user);
        return buildUserProfileResponse(savedUser);
    }

    private UserProfileResponse buildUserProfileResponse(User user) {
        StudentVerification verification = studentVerificationRepository.findByUserId(user.getId()).orElse(null);
        boolean verificationRequestSubmitted = verification != null && verification.getImageUrl() != null && !verification.getImageUrl().isBlank();
        VerificationStatus effectiveVerificationStatus = user.getVerificationStatus();
        if (effectiveVerificationStatus == VerificationStatus.PENDING && !verificationRequestSubmitted) {
            effectiveVerificationStatus = VerificationStatus.UNVERIFIED;
        }

        LocalDateTime planExpiresAt = userSubscriptionRepository.findByUser_IdAndIsActiveTrue(user.getId()).stream()
                .map(subscription -> subscription.getEndDate())
                .filter(endDate -> endDate != null)
                .max(Comparator.naturalOrder())
                .orElse(null);

        SubscriptionPlan activePlan = user.getPlan();
        SubscriptionService.StorageQuotaSnapshot quotaSnapshot = subscriptionService.getStorageQuotaSnapshot(user);
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = startOfDay.plusDays(1);
        long aiRequestsUsedToday = chatMessageRepository.countByUserIdAndSenderTypeBetween(
                user.getId(),
                SenderType.AI,
                startOfDay,
                endOfDay
        );

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .campus(user.getCampus())
                .majorName(user.getMajor() != null ? user.getMajor().getMajorName() : null)
                .majorId(user.getMajor() != null ? user.getMajor().getId() : null)
                .planName(activePlan != null ? activePlan.getPlanName() : "FREE")
                .planExpiresAt(planExpiresAt)
                .planStorageLimitMb(activePlan != null ? activePlan.getStorageLimitMb() : null)
                .planStorageLimitBytes(quotaSnapshot.storageLimitBytes())
                .planStorageUsedBytes(quotaSnapshot.storageUsedBytes())
                .planStorageUsedMb(quotaSnapshot.storageUsedMb())
                .planAiRequestsPerDay(activePlan != null ? activePlan.getAiRequestsPerDay() : null)
                .planAiRequestsUsedToday(aiRequestsUsedToday)
                .planCanUseAiSummary(activePlan != null ? activePlan.getCanUseAiSummary() : null)
                .planCanUseFlashcards(activePlan != null ? activePlan.getCanUseFlashcards() : null)
                .planCanUseQuizzes(activePlan != null ? activePlan.getCanUseQuizzes() : null)
                .planCanPublishDocuments(activePlan != null ? activePlan.getCanPublishDocuments() : null)
                .planCanPublishFolders(activePlan != null ? activePlan.getCanPublishFolders() : null)
                .storageStatus(quotaSnapshot.storageStatus())
                .overQuota(quotaSnapshot.overQuota())
                .canUpload(quotaSnapshot.canUpload())
                .storageMessage(quotaSnapshot.message())
                .currentSemester(user.getCurrentSemester())
                .status(user.getStatus())
                .verificationStatus(effectiveVerificationStatus)
                .verificationRequestSubmitted(verificationRequestSubmitted)
                .verificationReviewNote(verification != null ? verification.getReviewNote() : null)
                .role(user.getRole() != null ? user.getRole().getRoleName() : "USER")
                .build();
    }
}
