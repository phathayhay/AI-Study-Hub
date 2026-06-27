package com.studyhub.admin.service;

import com.studyhub.admin.dto.*;
import com.studyhub.common.PageResponse;
import com.studyhub.chat.entity.ChatMessage;
import com.studyhub.chat.entity.ChatSession;
import com.studyhub.chat.repository.ChatMessageRepository;
import com.studyhub.chat.repository.ChatSessionRepository;
import com.studyhub.common.enums.SenderType;
import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.NotificationType;
import com.studyhub.common.enums.ReportStatus;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.course.entity.Course;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.CourseRepository;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.DocumentDownload;
import com.studyhub.document.entity.DocumentView;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.document.entity.Report;
import com.studyhub.document.repository.DocumentCategoryRepository;
import com.studyhub.document.repository.DocumentDownloadRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.DocumentViewRepository;
import com.studyhub.document.repository.ReportRepository;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Collections;
import java.util.Locale;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    private final NotificationService notificationService;
    private final DocumentDownloadRepository documentDownloadRepository;
    private final DocumentViewRepository documentViewRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;

    private static final DateTimeFormatter DAY_LABEL_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");
    private static final DateTimeFormatter HOUR_LABEL_FORMATTER = DateTimeFormatter.ofPattern("HH:00");
    private static final DateTimeFormatter CSV_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    // ── 1. Quản lý người dùng (User Management) ─────────────────────────────────

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getAllUsers() {
        log.info("Admin: Fetching all users list");
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::mapUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminDashboardAnalyticsResponse getDashboardAnalytics() {
        log.info("Admin: Building dashboard analytics");

        List<User> users = userRepository.findAll();
        List<Document> documents = documentRepository.findAll();
        List<Report> reports = reportRepository.findAll();
        List<DocumentDownload> downloads = documentDownloadRepository.findAll();
        List<DocumentView> views = documentViewRepository.findAll();
        List<ChatMessage> chatMessages = chatMessageRepository.findAll();
        List<ChatSession> chatSessions = chatSessionRepository.findAll();

        return AdminDashboardAnalyticsResponse.builder()
                .recentUsers(users.stream()
                        .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                        .limit(3)
                        .map(this::mapUserResponse)
                        .collect(Collectors.toList()))
                .activities(buildRecentActivities(users, documents, reports, chatSessions))
                .uploadTrends(buildDailyCountSeriesFromDocuments(documents, 7))
                .downloadTrends(buildDailyCountSeriesFromDownloads(downloads, 7))
                .documentDistribution(buildDocumentDistribution(documents))
                .activeUsersByDay(buildActiveUsersByDay(documents, downloads, views, chatSessions, 7))
                .aiChatUsage24h(buildAiChatUsage(chatMessages))
                .build();
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
        List<AdminActivityLogResponse> allLogs = buildFilteredActivityLogs(query, type, dateFrom, dateTo);
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min(safePage * safeSize, allLogs.size());
        int toIndex = Math.min(fromIndex + safeSize, allLogs.size());
        List<AdminActivityLogResponse> content = fromIndex >= toIndex
                ? Collections.emptyList()
                : allLogs.subList(fromIndex, toIndex);

        int totalPages = allLogs.isEmpty() ? 0 : (int) Math.ceil((double) allLogs.size() / safeSize);
        return PageResponse.<AdminActivityLogResponse>builder()
                .content(content)
                .page(safePage)
                .size(safeSize)
                .totalElements(allLogs.size())
                .totalPages(totalPages)
                .last(toIndex >= allLogs.size())
                .build();
    }

    @Transactional(readOnly = true)
    public ResponseEntity<ByteArrayResource> exportActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        List<AdminActivityLogResponse> logs = buildFilteredActivityLogs(query, type, dateFrom, dateTo);
        StringBuilder csv = new StringBuilder("Time,Type,Action,Actor,Target,Status,Description\r\n");
        logs.forEach(item -> csv
                .append(csvValue(item.getCreatedAt() != null ? item.getCreatedAt().format(CSV_DATE_FORMATTER) : ""))
                .append(',')
                .append(csvValue(item.getType()))
                .append(',')
                .append(csvValue(item.getTitle()))
                .append(',')
                .append(csvValue(item.getActor()))
                .append(',')
                .append(csvValue(item.getTarget()))
                .append(',')
                .append(csvValue(item.getStatus()))
                .append(',')
                .append(csvValue(item.getDescription()))
                .append("\r\n"));

        byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename("admin-activity-logs.csv", StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(bytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(new ByteArrayResource(bytes));
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

    private List<AdminActivityItemResponse> buildRecentActivities(
            List<User> users,
            List<Document> documents,
            List<Report> reports,
            List<ChatSession> chatSessions
    ) {
        return Stream.concat(
                        Stream.concat(
                                users.stream().map(user -> AdminActivityItemResponse.builder()
                                        .title("New User Registered")
                                        .text((user.getFullName() == null || user.getFullName().isBlank() ? user.getEmail() : user.getFullName()) + " joined the platform")
                                        .tone("blue")
                                        .createdAt(user.getCreatedAt())
                                        .build()),
                                documents.stream().map(document -> AdminActivityItemResponse.builder()
                                        .title("Document Uploaded")
                                        .text(document.getTitle())
                                        .tone("green")
                                        .createdAt(document.getCreatedAt())
                                        .build())
                        ),
                        Stream.concat(
                                reports.stream().map(report -> AdminActivityItemResponse.builder()
                                        .title("Report Submitted")
                                        .text((report.getReportType() != null ? report.getReportType().name() : "REPORT") + " - " + (report.getDocument() != null ? report.getDocument().getTitle() : "Document"))
                                        .tone("orange")
                                        .createdAt(report.getCreatedAt())
                                        .build()),
                                chatSessions.stream().map(session -> AdminActivityItemResponse.builder()
                                        .title("AI Chat Started")
                                        .text(buildChatActivityText(session))
                                        .tone("purple")
                                        .createdAt(session.getCreatedAt())
                                        .build())
                        )
                )
                .filter(item -> item.getCreatedAt() != null)
                .sorted(Comparator.comparing(AdminActivityItemResponse::getCreatedAt).reversed())
                .limit(6)
                .collect(Collectors.toList());
    }

    private List<AdminActivityLogResponse> buildFilteredActivityLogs(
            String query,
            String type,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        List<AdminActivityLogResponse> logs = buildAllActivityLogs();
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        String normalizedType = type == null ? "" : type.trim().toLowerCase(Locale.ROOT);

        return logs.stream()
                .filter(item -> normalizedType.isBlank() || normalizedType.equalsIgnoreCase(item.getType()))
                .filter(item -> normalizedQuery.isBlank() || matchesActivityQuery(item, normalizedQuery))
                .filter(item -> matchesDateRange(item.getCreatedAt(), dateFrom, dateTo))
                .sorted(Comparator.comparing(AdminActivityLogResponse::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
    }

    private List<AdminActivityLogResponse> buildAllActivityLogs() {
        List<AdminActivityLogResponse> logs = new ArrayList<>();

        userRepository.findAll().forEach(user -> logs.add(AdminActivityLogResponse.builder()
                .type("user")
                .title("New User Registered")
                .description("A new account joined the platform")
                .actor(readUserName(user))
                .target(user.getEmail())
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .tone("blue")
                .createdAt(user.getCreatedAt())
                .build()));

        documentRepository.findAll().forEach(document -> logs.add(AdminActivityLogResponse.builder()
                .type("document")
                .title("Document Uploaded")
                .description("A new document was uploaded")
                .actor(document.getUser() != null ? readUserName(document.getUser()) : "Unknown user")
                .target(document.getTitle())
                .status(document.getModerationStatus() != null ? document.getModerationStatus().name() : "APPROVED")
                .tone("green")
                .createdAt(document.getCreatedAt())
                .build()));

        documentDownloadRepository.findAll().forEach(download -> logs.add(AdminActivityLogResponse.builder()
                .type("download")
                .title("Document Downloaded")
                .description("A user downloaded a document")
                .actor(download.getUser() != null ? readUserName(download.getUser()) : "Anonymous")
                .target(download.getDocument() != null ? download.getDocument().getTitle() : "Document")
                .status("SUCCESS")
                .tone("blue")
                .createdAt(download.getDownloadedAt())
                .build()));

        reportRepository.findAll().forEach(report -> logs.add(AdminActivityLogResponse.builder()
                .type("report")
                .title("Report Submitted")
                .description(report.getReportReason() != null && !report.getReportReason().isBlank()
                        ? report.getReportReason()
                        : "A content report was submitted")
                .actor(report.getReporter() != null ? readUserName(report.getReporter()) : "Unknown user")
                .target(report.getDocument() != null ? report.getDocument().getTitle() : "Document")
                .status(report.getStatus() != null ? report.getStatus().name() : "PENDING")
                .tone("orange")
                .createdAt(report.getCreatedAt())
                .build()));

        chatSessionRepository.findAll().forEach(session -> logs.add(AdminActivityLogResponse.builder()
                .type("ai")
                .title("AI Chat Started")
                .description(session.getDocument() != null && session.getDocument().getTitle() != null
                        ? "AI chat started for " + session.getDocument().getTitle()
                        : "A new AI chat session was created")
                .actor(session.getUser() != null ? readUserName(session.getUser()) : "Unknown user")
                .target(session.getDocument() != null ? session.getDocument().getTitle() : (session.getSessionTitle() != null ? session.getSessionTitle() : "General chat"))
                .status("STARTED")
                .tone("purple")
                .createdAt(session.getCreatedAt())
                .build()));

        return logs;
    }

    private boolean matchesActivityQuery(AdminActivityLogResponse item, String query) {
        return Stream.of(item.getTitle(), item.getDescription(), item.getActor(), item.getTarget(), item.getStatus(), item.getType())
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.contains(query));
    }

    private boolean matchesDateRange(LocalDateTime createdAt, LocalDate dateFrom, LocalDate dateTo) {
        if (createdAt == null) {
            return false;
        }
        LocalDate date = createdAt.toLocalDate();
        if (dateFrom != null && date.isBefore(dateFrom)) {
            return false;
        }
        if (dateTo != null && date.isAfter(dateTo)) {
            return false;
        }
        return true;
    }

    private String readUserName(User user) {
        if (user == null) {
            return "Unknown user";
        }
        String fullName = user.getFullName();
        return fullName == null || fullName.isBlank() ? user.getEmail() : fullName;
    }

    private String csvValue(String value) {
        String safe = value == null ? "" : value.replace("\"", "\"\"");
        return "\"" + safe + "\"";
    }

    private String buildChatActivityText(ChatSession session) {
        String userName = session.getUser() != null
                ? (session.getUser().getFullName() == null || session.getUser().getFullName().isBlank()
                    ? session.getUser().getEmail()
                    : session.getUser().getFullName())
                : "A user";
        if (session.getDocument() != null && session.getDocument().getTitle() != null && !session.getDocument().getTitle().isBlank()) {
            return userName + " started a chat on " + session.getDocument().getTitle();
        }
        return userName + " started a new AI chat session";
    }

    private List<AdminAnalyticsPointResponse> buildDailyCountSeriesFromDocuments(List<Document> documents, int days) {
        Map<LocalDate, Long> values = initDaySeries(days);
        documents.stream()
                .map(Document::getCreatedAt)
                .filter(timestamp -> timestamp != null)
                .map(LocalDateTime::toLocalDate)
                .forEach(date -> values.computeIfPresent(date, (key, value) -> value + 1));
        return toPointResponse(values);
    }

    private List<AdminAnalyticsPointResponse> buildDailyCountSeriesFromDownloads(List<DocumentDownload> downloads, int days) {
        Map<LocalDate, Long> values = initDaySeries(days);
        downloads.stream()
                .map(DocumentDownload::getDownloadedAt)
                .filter(timestamp -> timestamp != null)
                .map(LocalDateTime::toLocalDate)
                .forEach(date -> values.computeIfPresent(date, (key, value) -> value + 1));
        return toPointResponse(values);
    }

    private List<AdminAnalyticsPointResponse> buildDocumentDistribution(List<Document> documents) {
        return documents.stream()
                .collect(Collectors.groupingBy(
                        document -> document.getCourse() != null && document.getCourse().getCourseCode() != null && !document.getCourse().getCourseCode().isBlank()
                                ? document.getCourse().getCourseCode()
                                : "Unassigned",
                        Collectors.counting()
                ))
                .entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(6)
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey())
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<AdminAnalyticsPointResponse> buildActiveUsersByDay(
            List<Document> documents,
            List<DocumentDownload> downloads,
            List<DocumentView> views,
            List<ChatSession> chatSessions,
            int days
    ) {
        Map<LocalDate, Set<Long>> activeUsers = new LinkedHashMap<>();
        initDaySeries(days).keySet().forEach(date -> activeUsers.put(date, new HashSet<>()));

        documents.forEach(document -> addActiveUser(activeUsers, document.getCreatedAt(), document.getUser() != null ? document.getUser().getId() : null));
        downloads.forEach(download -> addActiveUser(activeUsers, download.getDownloadedAt(), download.getUser() != null ? download.getUser().getId() : null));
        views.forEach(view -> addActiveUser(activeUsers, view.getViewedAt(), view.getUser() != null ? view.getUser().getId() : null));
        chatSessions.forEach(session -> addActiveUser(activeUsers, session.getCreatedAt(), session.getUser() != null ? session.getUser().getId() : null));

        return activeUsers.entrySet().stream()
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey().format(DAY_LABEL_FORMATTER))
                        .value((long) entry.getValue().size())
                        .build())
                .collect(Collectors.toList());
    }

    private void addActiveUser(Map<LocalDate, Set<Long>> activeUsers, LocalDateTime timestamp, Long userId) {
        if (timestamp == null || userId == null) {
            return;
        }
        LocalDate date = timestamp.toLocalDate();
        Set<Long> users = activeUsers.get(date);
        if (users != null) {
            users.add(userId);
        }
    }

    private List<AdminAnalyticsPointResponse> buildAiChatUsage(List<ChatMessage> chatMessages) {
        LocalDateTime end = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        LocalDateTime start = end.minusHours(23);
        Map<LocalDateTime, Long> buckets = new LinkedHashMap<>();
        for (int i = 0; i < 24; i += 1) {
            LocalDateTime bucket = start.plusHours(i);
            buckets.put(bucket, 0L);
        }

        chatMessages.stream()
                .filter(message -> message.getSenderType() == SenderType.AI && message.getCreatedAt() != null)
                .map(ChatMessage::getCreatedAt)
                .filter(timestamp -> !timestamp.isBefore(start) && !timestamp.isAfter(end.plusHours(1).minusNanos(1)))
                .map(timestamp -> timestamp.withMinute(0).withSecond(0).withNano(0))
                .forEach(bucket -> buckets.computeIfPresent(bucket, (key, value) -> value + 1));

        return buckets.entrySet().stream()
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey().format(HOUR_LABEL_FORMATTER))
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private Map<LocalDate, Long> initDaySeries(int days) {
        Map<LocalDate, Long> values = new LinkedHashMap<>();
        LocalDate start = LocalDate.now().minusDays(days - 1L);
        for (int i = 0; i < days; i += 1) {
            values.put(start.plusDays(i), 0L);
        }
        return values;
    }

    private List<AdminAnalyticsPointResponse> toPointResponse(Map<LocalDate, Long> values) {
        return values.entrySet().stream()
                .map(entry -> AdminAnalyticsPointResponse.builder()
                        .label(entry.getKey().format(DAY_LABEL_FORMATTER))
                        .value(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }
}
