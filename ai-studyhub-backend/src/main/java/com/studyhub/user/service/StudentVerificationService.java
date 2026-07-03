package com.studyhub.user.service;

import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentVerificationService {

    private final StudentVerificationRepository studentVerificationRepository;
    private final UserRepository userRepository;
    private final CloudinaryStorageService cloudinaryStorageService;

    @Transactional
    public void uploadVerificationCard(MultipartFile file, String email) throws IOException {
        log.info("Processing student verification upload for user: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for the provided email"));

        if (user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("This account has been banned and can no longer submit student verification.");
        }

        if (user.getVerificationStatus() == VerificationStatus.APPROVED) {
            throw new IllegalStateException("Your student account has already been verified.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are accepted for student verification");
        }

        StudentVerification verification = studentVerificationRepository.findByUserId(user.getId())
                .orElse(null);

        if (verification != null) {
            String oldImageUrl = verification.getImageUrl();
            if (oldImageUrl != null && !oldImageUrl.isBlank()) {
                log.info("Deleting old verification image: {}", oldImageUrl);
                cloudinaryStorageService.deleteFile(oldImageUrl);
            }
        } else {
            verification = StudentVerification.builder()
                    .user(user)
                    .build();
        }

        String newImageUrl = cloudinaryStorageService.uploadFile(file, "student_verifications");

        verification.setImageUrl(newImageUrl);
        verification.setStatus(VerificationStatus.PENDING);
        verification.setReviewNote(null);
        verification.setReviewedBy(null);
        verification.setReviewedAt(null);
        studentVerificationRepository.save(verification);

        user.setVerificationStatus(VerificationStatus.PENDING);
        userRepository.save(user);

        log.info("Student verification request submitted successfully for user: {}", email);
    }
}
