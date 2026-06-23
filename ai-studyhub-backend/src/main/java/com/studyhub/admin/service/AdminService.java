package com.studyhub.admin.service;

import com.studyhub.admin.dto.*;
import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.ReportStatus;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.course.entity.Course;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.CourseRepository;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.document.entity.Report;
import com.studyhub.document.repository.DocumentCategoryRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.ReportRepository;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
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
public class AdminService {

    private final UserRepository userRepository;
    private final StudentVerificationRepository studentVerificationRepository;
    private final DocumentRepository documentRepository;
    private final ReportRepository reportRepository;
    private final MajorRepository majorRepository;
    private final CourseRepository courseRepository;
    private final DocumentCategoryRepository documentCategoryRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;

    // ── 1. Quản lý người dùng (User Management) ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        log.info("Admin: Fetching all users list");
        return userRepository.findAll().stream()
                .map(user -> AdminUserResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .verificationStatus(user.getVerificationStatus() != null ? user.getVerificationStatus().name() : null)
                        .status(user.getStatus() != null ? user.getStatus().name() : null)
                        .planName(user.getPlan() != null ? user.getPlan().getPlanName() : "FREE")
                        .roleName(user.getRole() != null ? user.getRole().getRoleName() : "USER")
                        .createdAt(user.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void banUser(Long userId) {
        log.info("Admin: Banning user ID {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(UserStatus.BANNED);
        userRepository.save(user);
    }

    @Transactional
    public void unbanUser(Long userId) {
        log.info("Admin: Unbanning user ID {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
    }

    // ── 2. Duyệt yêu cầu xác thực thẻ sinh viên (Verification Review) ────────────

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

        // Update corresponding User Verification status
        User user = verification.getUser();
        user.setVerificationStatus(targetStatus);
        
        // If approved, verify the user account and activate if inactive
        if (targetStatus == VerificationStatus.APPROVED) {
            if (user.getStatus() == UserStatus.INACTIVE) {
                user.setStatus(UserStatus.ACTIVE);
            }
        }
        userRepository.save(user);
    }

    // ── 3. Duyệt/Moderate tài liệu & Reports ────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminDocumentResponse> getAllDocuments() {
        log.info("Admin: Fetching all documents");
        return documentRepository.findAll().stream()
                .map(doc -> AdminDocumentResponse.builder()
                        .id(doc.getId())
                        .title(doc.getTitle())
                        .fileName(doc.getFileName())
                        .fileSize(doc.getFileSize())
                        .visibility(doc.getVisibility() != null ? doc.getVisibility().name() : null)
                        .moderationStatus(doc.getModerationStatus() != null ? doc.getModerationStatus().name() : null)
                        .ownerEmail(doc.getUser().getEmail())
                        .averageRating(doc.getAverageRating())
                        .createdAt(doc.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void moderateDocument(Long documentId, DocumentModerationRequest request) {
        log.info("Admin: Moderating document ID {} status to {}", documentId, request.getStatus());
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        ModerationStatus targetStatus = ModerationStatus.valueOf(request.getStatus().toUpperCase());
        document.setModerationStatus(targetStatus);
        documentRepository.save(document);
    }

    @Transactional(readOnly = true)
    public List<AdminReportResponse> getAllReports() {
        log.info("Admin: Fetching all user reports");
        return reportRepository.findAll().stream()
                .map(report -> AdminReportResponse.builder()
                        .id(report.getId())
                        .reporterEmail(report.getReporter().getEmail())
                        .documentId(report.getDocument().getId())
                        .documentTitle(report.getDocument().getTitle())
                        .reportType(report.getReportType().name())
                        .status(report.getStatus().name())
                        .reportReason(report.getReportReason())
                        .createdAt(report.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void resolveReport(Long reportId, ReportResolveRequest request) {
        log.info("Admin: Resolving report ID to status {}", reportId, request.getStatus());
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        ReportStatus targetStatus = ReportStatus.valueOf(request.getStatus().toUpperCase());
        report.setStatus(targetStatus);
        reportRepository.save(report);

        // Ban/reject document if requested and resolved
        if (request.isDeleteDocument() && targetStatus == ReportStatus.RESOLVED) {
            Document doc = report.getDocument();
            doc.setModerationStatus(ModerationStatus.REJECTED);
            documentRepository.save(doc);
        }
    }

    // ── 4. Quản lý cấu hình hệ thống (CRUD) ──────────────────────────────────────

    // --- Majors CRUD
    @Transactional(readOnly = true)
    public List<Major> getAllMajors() {
        return majorRepository.findAll();
    }

    @Transactional
    public Major createMajor(MajorRequest request) {
        if (majorRepository.findByMajorCode(request.getMajorCode().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Major code already exists");
        }
        Major major = Major.builder()
                .majorCode(request.getMajorCode().toUpperCase())
                .majorName(request.getMajorName())
                .description(request.getDescription())
                .build();
        return majorRepository.save(major);
    }

    @Transactional
    public Major updateMajor(Long id, MajorRequest request) {
        Major major = majorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Major not found"));
        major.setMajorName(request.getMajorName());
        major.setDescription(request.getDescription());
        return majorRepository.save(major);
    }

    @Transactional
    public void deleteMajor(Long id) {
        if (!majorRepository.existsById(id)) {
            throw new IllegalArgumentException("Major not found");
        }
        majorRepository.deleteById(id);
    }

    // --- Courses CRUD
    @Transactional(readOnly = true)
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Transactional
    public Course createCourse(CourseRequest request) {
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new IllegalArgumentException("Major not found"));
        Course course = Course.builder()
                .courseCode(request.getCourseCode().toUpperCase())
                .courseName(request.getCourseName())
                .description(request.getDescription())
                .major(major)
                .isActive(request.getIsActive())
                .build();
        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        Major major = majorRepository.findById(request.getMajorId())
                .orElseThrow(() -> new IllegalArgumentException("Major not found"));

        course.setCourseName(request.getCourseName());
        course.setDescription(request.getDescription());
        course.setMajor(major);
        course.setIsActive(request.getIsActive());
        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new IllegalArgumentException("Course not found");
        }
        courseRepository.deleteById(id);
    }

    // --- Categories CRUD
    @Transactional(readOnly = true)
    public List<DocumentCategory> getAllCategories() {
        return documentCategoryRepository.findAll();
    }

    @Transactional
    public DocumentCategory createCategory(CategoryRequest request) {
        DocumentCategory category = DocumentCategory.builder()
                .categoryName(request.getCategoryName())
                .build();
        return documentCategoryRepository.save(category);
    }

    @Transactional
    public DocumentCategory updateCategory(Long id, CategoryRequest request) {
        DocumentCategory category = documentCategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        category.setCategoryName(request.getCategoryName());
        return documentCategoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!documentCategoryRepository.existsById(id)) {
            throw new IllegalArgumentException("Category not found");
        }
        documentCategoryRepository.deleteById(id);
    }

    // --- Subscription Plans CRUD
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllPlans() {
        return subscriptionPlanRepository.findAll();
    }

    @Transactional
    public SubscriptionPlan createPlan(SubscriptionPlanRequest request) {
        SubscriptionPlan plan = SubscriptionPlan.builder()
                .planName(request.getPlanName().toUpperCase())
                .description(request.getDescription())
                .price(request.getPrice())
                .storageLimitMb(request.getStorageLimitMb())
                .aiRequestsPerDay(request.getAiRequestsPerDay())
                .isActive(request.getIsActive())
                .build();
        return subscriptionPlanRepository.save(plan);
    }

    @Transactional
    public SubscriptionPlan updatePlan(Long id, SubscriptionPlanRequest request) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found"));

        plan.setPlanName(request.getPlanName().toUpperCase());
        plan.setDescription(request.getDescription());
        plan.setPrice(request.getPrice());
        plan.setStorageLimitMb(request.getStorageLimitMb());
        plan.setAiRequestsPerDay(request.getAiRequestsPerDay());
        plan.setIsActive(request.getIsActive());
        return subscriptionPlanRepository.save(plan);
    }

    @Transactional
    public void deletePlan(Long id) {
        if (!subscriptionPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Subscription plan not found");
        }
        subscriptionPlanRepository.deleteById(id);
    }
}
