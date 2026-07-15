package com.studyhub.admin.service;

import com.studyhub.admin.dto.AdminVerificationResponse;
import com.studyhub.admin.dto.VerificationReviewRequest;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminVerificationServiceImplTest {

    @Mock
    private StudentVerificationRepository studentVerificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminVerificationServiceImpl adminVerificationService;

    private User student;
    private User admin;
    private StudentVerification verification;

    @BeforeEach
    void setUp() {
        student = User.builder()
                .id(100L)
                .email("student@fpt.edu.vn")
                .firstName("Nguyen")
                .lastName("Van A")
                .status(UserStatus.INACTIVE)
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        admin = User.builder()
                .id(1L)
                .email("admin@studyhub.com")
                .firstName("Admin")
                .lastName("User")
                .build();

        verification = StudentVerification.builder()
                .id(200L)
                .user(student)
                .imageUrl("student-card.jpg")
                .status(VerificationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    void getPendingVerifications_ShouldReturnPendingRequests() {
        // Arrange
        when(studentVerificationRepository.findByStatus(VerificationStatus.PENDING))
                .thenReturn(Collections.singletonList(verification));

        // Act
        List<AdminVerificationResponse> responses = adminVerificationService.getPendingVerifications();

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("student-card.jpg", responses.get(0).getImageUrl());
        assertEquals("student@fpt.edu.vn", responses.get(0).getUserEmail());
        verify(studentVerificationRepository, times(1)).findByStatus(VerificationStatus.PENDING);
    }

    @Test
    void reviewVerification_WhenApproved_ShouldActivateUserAndSetApprovedStatus() {
        // Arrange
        VerificationReviewRequest request = new VerificationReviewRequest();
        request.setStatus("APPROVED");
        request.setReviewNote("Legitimate student ID");

        when(studentVerificationRepository.findById(verification.getId())).thenReturn(Optional.of(verification));
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));

        // Act
        adminVerificationService.reviewVerification(verification.getId(), request, admin.getEmail());

        // Assert
        assertEquals(VerificationStatus.APPROVED, verification.getStatus());
        assertEquals("Legitimate student ID", verification.getReviewNote());
        assertEquals(admin, verification.getReviewedBy());
        assertNotNull(verification.getReviewedAt());

        assertEquals(VerificationStatus.APPROVED, student.getVerificationStatus());
        assertEquals(UserStatus.ACTIVE, student.getStatus());

        verify(studentVerificationRepository, times(1)).save(verification);
        verify(userRepository, times(1)).save(student);
    }

    @Test
    void reviewVerification_WhenRejected_ShouldSetRejectedStatusAndKeepUserStatus() {
        // Arrange
        VerificationReviewRequest request = new VerificationReviewRequest();
        request.setStatus("REJECTED");
        request.setReviewNote("Blurred photo");

        when(studentVerificationRepository.findById(verification.getId())).thenReturn(Optional.of(verification));
        when(userRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));

        // Act
        adminVerificationService.reviewVerification(verification.getId(), request, admin.getEmail());

        // Assert
        assertEquals(VerificationStatus.REJECTED, verification.getStatus());
        assertEquals("Blurred photo", verification.getReviewNote());
        assertEquals(VerificationStatus.REJECTED, student.getVerificationStatus());
        assertEquals(UserStatus.INACTIVE, student.getStatus()); // keeps INACTIVE status if rejected

        verify(studentVerificationRepository, times(1)).save(verification);
        verify(userRepository, times(1)).save(student);
    }
}
