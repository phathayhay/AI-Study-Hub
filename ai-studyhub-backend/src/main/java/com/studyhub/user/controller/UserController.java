package com.studyhub.user.controller;

import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.common.ApiResponse;
import com.studyhub.common.enums.SenderType;
import com.studyhub.security.SecurityUtils;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.dto.NotificationSummaryResponse;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import com.studyhub.user.service.NotificationService;
import com.studyhub.user.service.StudentVerificationService;
import com.studyhub.user.service.SubscriptionService;
import com.studyhub.user.dto.UserProfileResponse;
import com.studyhub.user.dto.UpdateProfileRequest;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.MajorRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile management APIs")
public class UserController {

    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final CloudinaryStorageService cloudinaryStorageService;
    private final StudentVerificationService studentVerificationService;
    private final StudentVerificationRepository studentVerificationRepository;
    private final MajorRepository majorRepository;
    private final NotificationService notificationService;
    private final ChatMessageRepository chatMessageRepository;
    private final SubscriptionService subscriptionService;

    // API tải lên ảnh đại diện của người dùng
    @PostMapping(value = "/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload user avatar", description = "Uploads an avatar image to Firebase Storage, automatically cleans up the old one if it exists, and updates avatarUrl in the database.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Avatar uploaded successfully, returns image CDN URL", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Avatar uploaded successfully\", \"data\": \"https://firebasestorage.googleapis.com/v0/b/ai-studyhub/o/avatars%2Fimage.jpg\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Uploaded file is empty or invalid", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Uploaded file cannot be empty\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error or Firebase storage failure", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Failed to upload avatar, please try again later.\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<ApiResponse<String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Uploading avatar for user {}", email);

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        try {
            // Xóa ảnh đại diện cũ trên Cloudinary nếu có
            String oldAvatarUrl = user.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
                cloudinaryStorageService.deleteFile(oldAvatarUrl);
            }

            // Tải ảnh đại diện mới lên Cloudinary
            String newAvatarUrl = cloudinaryStorageService.uploadFile(file, "avatars");

            // Cập nhật đường dẫn ảnh mới vào Database
            user.setAvatarUrl(newAvatarUrl);
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.ok("Avatar uploaded successfully", newAvatarUrl));
        } catch (IOException e) {
            log.error("Failed to upload avatar for user {}: {}", email, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to upload avatar, please try again later."));
        }
    }

    // API gửi yêu cầu xác minh thẻ sinh viên
    @PostMapping(value = "/verify-student", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit student identity verification", description = "Uploads a student card image to Cloudinary, registers/updates the student verification request, and sets the user's verification status to PENDING.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Verification request submitted successfully", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Verification request submitted successfully. Please wait for admin approval.\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid file or parameters", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"File cannot be empty\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Failed to submit verification request, please try again later.\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<ApiResponse<Void>> verifyStudent(@RequestParam("file") MultipartFile file) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Submit student verification request for user {}", email);
        try {
            studentVerificationService.uploadVerificationCard(file, email);
            return ResponseEntity.ok(ApiResponse.ok("Verification request submitted successfully. Please wait for admin approval."));
        } catch (IOException e) {
            log.error("Failed to upload student verification for user {}: {}", email, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to upload verification card, please try again later."));
        }
    }

    // API lấy thông tin cá nhân của người dùng hiện tại
    @GetMapping("/profile")
    @Operation(summary = "Get current user profile", description = "Retrieves profile details of the currently authenticated user.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Profile retrieved successfully", content = @Content(schema = @Schema(implementation = com.studyhub.user.dto.UserProfileResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class)))
    })
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile() {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Retrieving profile for user {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserProfileResponse profileResponse = buildUserProfileResponse(user);

        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved successfully", profileResponse));
    }

    // API cập nhật thông tin cá nhân
    @PutMapping("/profile")
    @Operation(summary = "Update current user profile", description = "Updates details of the currently authenticated user.")
    @Transactional
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Updating profile for user {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());

        if (request.getCampus() != null && !request.getCampus().isBlank()) {
            try {
                user.setCampus(com.studyhub.common.enums.Campus.valueOf(request.getCampus().toUpperCase()));
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

        UserProfileResponse profileResponse = buildUserProfileResponse(savedUser);

        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", profileResponse));
    }

    private UserProfileResponse buildUserProfileResponse(User user) {
        StudentVerification verification = studentVerificationRepository.findByUserId(user.getId()).orElse(null);
        boolean verificationRequestSubmitted = verification != null && verification.getImageUrl() != null && !verification.getImageUrl().isBlank();
        com.studyhub.common.enums.VerificationStatus effectiveVerificationStatus = user.getVerificationStatus();
        if (effectiveVerificationStatus == com.studyhub.common.enums.VerificationStatus.PENDING && !verificationRequestSubmitted) {
            effectiveVerificationStatus = com.studyhub.common.enums.VerificationStatus.UNVERIFIED;
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

    @GetMapping("/notifications")
    @Operation(summary = "Get current user notifications", description = "Returns the current user's notifications together with unread count.")
    public ResponseEntity<ApiResponse<NotificationSummaryResponse>> getNotifications() {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Retrieving notifications for user {}", email);
        NotificationSummaryResponse response = notificationService.getNotifications(email);
        return ResponseEntity.ok(ApiResponse.ok("Notifications retrieved successfully", response));
    }

    @PutMapping("/notifications/{id}/read")
    @Operation(summary = "Mark one notification as read", description = "Marks a single notification as read for the current user.")
    public ResponseEntity<ApiResponse<Void>> markNotificationAsRead(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Marking notification {} as read for user {}", id, email);
        notificationService.markAsRead(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read"));
    }

    @PutMapping("/notifications/read-all")
    @Operation(summary = "Mark all notifications as read", description = "Marks all notifications as read for the current user.")
    public ResponseEntity<ApiResponse<Void>> markAllNotificationsAsRead() {
        String email = SecurityUtils.getCurrentUserEmail();
        int updatedCount = notificationService.markAllAsRead(email);
        log.info("API: Marked {} notifications as read for user {}", updatedCount, email);
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }
}


