package com.studyhub.admin.service;

import com.studyhub.admin.dto.AdminVerificationResponse;
import com.studyhub.admin.dto.VerificationReviewRequest;

import java.util.List;

public interface AdminVerificationService {
    /**
     * Fetch all student identity verification requests with PENDING status.
     *
     * @return List of AdminVerificationResponse
     */
    List<AdminVerificationResponse> getPendingVerifications();

    /**
     * Review student verification request (Approve or Reject) and notify the student.
     *
     * @param verificationId verification request ID
     * @param request        review decision and review notes
     * @param adminEmail     reviewer admin email
     */
    void reviewVerification(Long verificationId, VerificationReviewRequest request, String adminEmail);
}
