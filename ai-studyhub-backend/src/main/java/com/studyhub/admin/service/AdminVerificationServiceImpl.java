package com.studyhub.admin.service;

import com.studyhub.admin.dto.AdminVerificationResponse;
import com.studyhub.admin.dto.VerificationReviewRequest;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminVerificationServiceImpl implements AdminVerificationService {

    private final StudentVerificationRepository studentVerificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AdminVerificationResponse> getPendingVerifications() {
        log.info("Admin: Fetching pending verifications");
        return studentVerificationRepository.findByStatus(VerificationStatus.PENDING).stream()
                .map(verification -> AdminVerificationResponse.builder()
                        .id(verification.getId())
                        .userId(verification.getUser().getId())
                        .userEmail(verification.getUser().getEmail())
                        .userFullName(verification.getUser().getFullName())
                        .imageUrl(verification.getImageUrl())
                        .status(verification.getStatus().name())
                        .reviewNote(verification.getReviewNote())
                        .reviewedByEmail(verification.getReviewedBy() != null ? verification.getReviewedBy().getEmail() : null)
                        .reviewedAt(verification.getReviewedAt())
                        .createdAt(verification.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void reviewVerification(Long verificationId, VerificationReviewRequest request, String adminEmail) {
        log.info("Admin {} reviewing verification ID {}", adminEmail, verificationId);

        StudentVerification verification = studentVerificationRepository.findById(verificationId)
                .orElseThrow(() -> new IllegalArgumentException("Verification request not found"));

        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        VerificationStatus targetStatus = VerificationStatus.valueOf(request.getStatus().toUpperCase());

        verification.setStatus(targetStatus);
        verification.setReviewNote(request.getReviewNote());
        verification.setReviewedBy(admin);
        verification.setReviewedAt(LocalDateTime.now());
        studentVerificationRepository.save(verification);

        // Cập nhật trạng thái Verification status tương ứng trên User
        User user = verification.getUser();
        user.setVerificationStatus(targetStatus);
        
        // Nếu được duyệt, đổi UserStatus thành ACTIVE nếu họ đang INACTIVE
        if (targetStatus == VerificationStatus.APPROVED) {
            if (user.getStatus() == UserStatus.INACTIVE) {
                user.setStatus(UserStatus.ACTIVE);
            }
        }
        userRepository.save(user);
    }
}
