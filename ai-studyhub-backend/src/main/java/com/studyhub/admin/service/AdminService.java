package com.studyhub.admin.service;

import com.studyhub.admin.dto.*;
import com.studyhub.common.PageResponse;
import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.NotificationType;
import com.studyhub.common.enums.ReportStatus;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.course.dto.CourseListResponse;
import com.studyhub.course.entity.Course;
import com.studyhub.course.entity.Major;
import com.studyhub.course.service.CourseService;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.document.entity.Report;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.ReportRepository;
import com.studyhub.document.service.DocumentService;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.service.NotificationService;
import com.studyhub.user.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ReportRepository reportRepository;
    private final NotificationService notificationService;

    // Decomposed Services
    private final CourseService courseService;
    private final SubscriptionService subscriptionService;
    private final DocumentService documentService;
    private final AdminVerificationService adminVerificationService;
    private final AdminAnalyticsService adminAnalyticsService;

    // ── 1. Quản lý người dùng (User Management) ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        log.info("Admin: Fetching all users list");
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::mapUserResponse)
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

    // ── 2. Analytics & Activity Logs (Delegated) ───────────────────────────────

    @Transactional(readOnly = true)
    public AdminDashboardAnalyticsResponse getDashboardAnalytics() {
        return adminAnalyticsService.getDashboardAnalytics();
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminActivityLogResponse> getActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo,
            int page,
            int size
    ) {
        return adminAnalyticsService.getActivityLogs(query, type, dateFrom, dateTo, page, size);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ByteArrayResource> exportActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        return adminAnalyticsService.exportActivityLogs(query, type, dateFrom, dateTo);
    }

    // ── 3. Duyệt yêu cầu xác thực thẻ sinh viên (Delegated) ─────────────────────

    @Transactional(readOnly = true)
    public List<AdminVerificationResponse> getPendingVerifications() {
        return adminVerificationService.getPendingVerifications();
    }

    @Transactional
    public void reviewVerification(Long verificationId, VerificationReviewRequest request, String adminEmail) {
        adminVerificationService.reviewVerification(verificationId, request, adminEmail);
    }

    // ── 4. Duyệt/Moderate tài liệu & Reports ────────────────────────────────────

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

        String documentTitle = document.getTitle() != null && !document.getTitle().isBlank()
                ? document.getTitle()
                : "your document";

        if (targetStatus == ModerationStatus.APPROVED) {
            notificationService.createNotification(
                    document.getUser(),
                    "Document Approved",
                    "Your document \"" + documentTitle + "\" has been approved and published.",
                    NotificationType.DOCUMENT
            );
        } else if (targetStatus == ModerationStatus.REJECTED) {
            String reason = request.getReason() != null && !request.getReason().isBlank()
                    ? " Reason: " + request.getReason().trim()
                    : "";
            notificationService.createNotification(
                    document.getUser(),
                    "Document Rejected",
                    "Your document \"" + documentTitle + "\" was rejected." + reason,
                    NotificationType.DOCUMENT
            );
        }
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

    @Transactional(readOnly = true)
    public AdminReportDetailResponse getReportDetail(Long reportId) {
        log.info("Admin: Fetching detail for report ID {}", reportId);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        Document document = report.getDocument();
        User reporter = report.getReporter();

        return AdminReportDetailResponse.builder()
                .id(report.getId())
                .reporterEmail(reporter != null ? reporter.getEmail() : null)
                .reporterFullName(reporter != null ? reporter.getFullName() : null)
                .documentOwnerEmail(document != null && document.getUser() != null ? document.getUser().getEmail() : null)
                .documentId(document != null ? document.getId() : null)
                .documentTitle(document != null ? document.getTitle() : null)
                .documentFileName(document != null ? document.getFileName() : null)
                .documentVisibility(document != null && document.getVisibility() != null ? document.getVisibility().name() : null)
                .documentModerationStatus(document != null && document.getModerationStatus() != null ? document.getModerationStatus().name() : null)
                .courseCode(document != null && document.getCourse() != null ? document.getCourse().getCourseCode() : null)
                .courseName(document != null && document.getCourse() != null ? document.getCourse().getCourseName() : null)
                .documentReportCount(document != null ? reportRepository.countByDocumentId(document.getId()) : 0)
                .reportType(report.getReportType() != null ? report.getReportType().name() : null)
                .status(report.getStatus() != null ? report.getStatus().name() : null)
                .reportReason(report.getReportReason())
                .createdAt(report.getCreatedAt())
                .documentCreatedAt(document != null ? document.getCreatedAt() : null)
                .build();
    }

    @Transactional
    public void resolveReport(Long reportId, ReportResolveRequest request) {
        log.info("Admin: Resolving report ID to status {}", reportId, request.getStatus());
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found"));

        ReportStatus targetStatus = ReportStatus.valueOf(request.getStatus().toUpperCase());
        report.setStatus(targetStatus);
        reportRepository.save(report);

        // Xoá (từ chối duyệt) tài liệu nếu yêu cầu
        if (request.isDeleteDocument() && targetStatus == ReportStatus.RESOLVED) {
            Document doc = report.getDocument();
            doc.setModerationStatus(ModerationStatus.REJECTED);
            documentRepository.save(doc);
        }
    }

    // ── 5. Quản lý cấu hình hệ thống (Delegated) ───────────────────────────────

    // --- Majors CRUD
    @Transactional(readOnly = true)
    public List<Major> getAllMajors() {
        return courseService.getAllMajors();
    }

    @Transactional
    public Major createMajor(MajorRequest request) {
        return courseService.createMajor(request);
    }

    @Transactional
    public Major updateMajor(Long id, MajorRequest request) {
        return courseService.updateMajor(id, request);
    }

    @Transactional
    public void deleteMajor(Long id) {
        courseService.deleteMajor(id);
    }

    // --- Courses CRUD
    @Transactional(readOnly = true)
    public List<CourseListResponse> getAllCourses() {
        return courseService.getAllCourses();
    }

    @Transactional
    public CourseListResponse createCourse(CourseRequest request) {
        return courseService.createCourse(request);
    }

    @Transactional
    public CourseListResponse updateCourse(Long id, CourseRequest request) {
        return courseService.updateCourse(id, request);
    }

    @Transactional
    public void deleteCourse(Long id) {
        courseService.deleteCourse(id);
    }

    // --- Categories CRUD
    @Transactional(readOnly = true)
    public List<DocumentCategory> getAllCategories() {
        return documentService.getAllCategories();
    }

    @Transactional
    public DocumentCategory createCategory(CategoryRequest request) {
        return documentService.createCategory(request);
    }

    @Transactional
    public DocumentCategory updateCategory(Long id, CategoryRequest request) {
        return documentService.updateCategory(id, request);
    }

    @Transactional
    public void deleteCategory(Long id) {
        documentService.deleteCategory(id);
    }

    // --- Subscription Plans CRUD
    @Transactional(readOnly = true)
    public List<SubscriptionPlan> getAllPlans() {
        return subscriptionService.getAllPlans();
    }

    @Transactional
    public SubscriptionPlan createPlan(SubscriptionPlanRequest request) {
        return subscriptionService.createPlan(request);
    }

    @Transactional
    public SubscriptionPlan updatePlan(Long id, SubscriptionPlanRequest request) {
        return subscriptionService.updatePlan(id, request);
    }

    @Transactional
    public void deletePlan(Long id) {
        subscriptionService.deletePlan(id);
    }

    @Transactional(readOnly = true)
    public List<com.studyhub.user.dto.SubscriptionPlanVersionResponse> getPlanVersions(Long id) {
        return subscriptionService.getPlanVersions(id);
    }

    private AdminUserResponse mapUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .verificationStatus(user.getVerificationStatus() != null ? user.getVerificationStatus().name() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .planName(user.getPlan() != null ? user.getPlan().getPlanName() : "FREE")
                .roleName(user.getRole() != null ? user.getRole().getRoleName() : "USER")
                .createdAt(user.getCreatedAt())
                .build();
    }
}
