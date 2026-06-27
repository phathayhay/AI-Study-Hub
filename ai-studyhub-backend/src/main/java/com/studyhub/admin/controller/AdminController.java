package com.studyhub.admin.controller;

import com.studyhub.admin.dto.*;
import com.studyhub.admin.service.AdminService;
import com.studyhub.common.ApiResponse;
import com.studyhub.common.PageResponse;
import com.studyhub.course.entity.Course;
import com.studyhub.course.entity.Major;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.security.SecurityUtils;
import com.studyhub.user.entity.SubscriptionPlan;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Portal", description = "Administration, moderation, and lookup configurations management APIs")
public class AdminController {

    private final AdminService adminService;

    // ── 1. Quản lý người dùng (User Management) ─────────────────────────────────

    @GetMapping("/users")
    @Operation(summary = "Get all users list", description = "Retrieves a list of all users registered in the system.")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        log.info("API Admin: Fetching all users list");
        List<AdminUserResponse> response = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Users list retrieved successfully", response));
    }

    @GetMapping("/dashboard/analytics")
    @Operation(summary = "Get dashboard analytics", description = "Retrieves real analytics data for the admin overview dashboard.")
    public ResponseEntity<ApiResponse<AdminDashboardAnalyticsResponse>> getDashboardAnalytics() {
        log.info("API Admin: Fetching dashboard analytics");
        AdminDashboardAnalyticsResponse response = adminService.getDashboardAnalytics();
        return ResponseEntity.ok(ApiResponse.ok("Dashboard analytics retrieved successfully", response));
    }

    @GetMapping("/activity-logs")
    @Operation(summary = "Get activity logs", description = "Retrieves filtered and paginated administrative activity logs.")
    public ResponseEntity<ApiResponse<PageResponse<AdminActivityLogResponse>>> getActivityLogs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<AdminActivityLogResponse> response = adminService.getActivityLogs(query, type, dateFrom, dateTo, page, size);
        return ResponseEntity.ok(ApiResponse.ok("Activity logs retrieved successfully", response));
    }

    @GetMapping("/activity-logs/export")
    @Operation(summary = "Export activity logs", description = "Exports the filtered administrative activity logs to CSV.")
    public ResponseEntity<ByteArrayResource> exportActivityLogs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        return adminService.exportActivityLogs(query, type, dateFrom, dateTo);
    }

    @PostMapping("/users/{id}/ban")
    @Operation(summary = "Ban user account", description = "Bans a user account by setting their status to BANNED.")
    public ResponseEntity<ApiResponse<String>> banUser(@PathVariable Long id) {
        log.info("API Admin: Banning user ID {}", id);
        adminService.banUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User account has been banned successfully"));
    }

    @PostMapping("/users/{id}/unban")
    @Operation(summary = "Unban user account", description = "Unbans a user account by restoring their status to ACTIVE.")
    public ResponseEntity<ApiResponse<String>> unbanUser(@PathVariable Long id) {
        log.info("API Admin: Unbanning user ID {}", id);
        adminService.unbanUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User account has been unbanned successfully"));
    }

    // ── 2. Duyệt yêu cầu xác thực thẻ sinh viên (Verification Review) ────────────

    @GetMapping("/verifications/pending")
    @Operation(summary = "Get pending verifications", description = "Retrieves all pending student verifications for review.")
    public ResponseEntity<ApiResponse<List<AdminVerificationResponse>>> getPendingVerifications() {
        log.info("API Admin: Retrieving pending student verifications");
        List<AdminVerificationResponse> response = adminService.getPendingVerifications();
        return ResponseEntity.ok(ApiResponse.ok("Pending verifications retrieved successfully", response));
    }

    @PostMapping("/verifications/{id}/review")
    @Operation(summary = "Review student identity verification card", description = "Approves or rejects a student identity card verification request.")
    public ResponseEntity<ApiResponse<String>> reviewVerification(
            @PathVariable Long id,
            @Valid @RequestBody VerificationReviewRequest request) {
        String adminEmail = SecurityUtils.getCurrentUserEmail();
        log.info("API Admin: Reviewing verification request ID {} by admin {}", id, adminEmail);
        adminService.reviewVerification(id, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.ok("Verification request reviewed successfully"));
    }

    // ── 3. Duyệt/Moderate tài liệu & Reports ────────────────────────────────────

    @GetMapping("/documents")
    @Operation(summary = "Get all documents", description = "Retrieves all documents uploaded in the system for administrative audit.")
    public ResponseEntity<ApiResponse<List<AdminDocumentResponse>>> getAllDocuments() {
        log.info("API Admin: Retrieving all documents");
        List<AdminDocumentResponse> response = adminService.getAllDocuments();
        return ResponseEntity.ok(ApiResponse.ok("All documents retrieved successfully", response));
    }

    @PostMapping("/documents/{id}/moderate")
    @Operation(summary = "Moderate uploaded document", description = "Approves or rejects a document to control visibility in the community feed.")
    public ResponseEntity<ApiResponse<String>> moderateDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentModerationRequest request) {
        log.info("API Admin: Moderating document ID {}", id);
        adminService.moderateDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Document moderation status updated successfully"));
    }

    @GetMapping("/reports")
    @Operation(summary = "Get all reports", description = "Retrieves all content violation reports submitted by users.")
    public ResponseEntity<ApiResponse<List<AdminReportResponse>>> getAllReports() {
        log.info("API Admin: Retrieving all reports");
        List<AdminReportResponse> response = adminService.getAllReports();
        return ResponseEntity.ok(ApiResponse.ok("All reports retrieved successfully", response));
    }

    @PostMapping("/reports/{id}/resolve")
    @Operation(summary = "Resolve violation report", description = "Resolves a user report and optionally rejects/bans the reported document.")
    public ResponseEntity<ApiResponse<String>> resolveReport(
            @PathVariable Long id,
            @Valid @RequestBody ReportResolveRequest request) {
        log.info("API Admin: Resolving report ID {}", id);
        adminService.resolveReport(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Report status resolved successfully"));
    }

    // ── 4. Quản lý cấu hình hệ thống (CRUD) ──────────────────────────────────────

    // --- Majors CRUD
    @GetMapping("/majors")
    @Operation(summary = "List all majors config", description = "Retrieves all major configurations in the system.")
    public ResponseEntity<ApiResponse<List<Major>>> getAllMajors() {
        return ResponseEntity.ok(ApiResponse.ok("Majors retrieved successfully", adminService.getAllMajors()));
    }

    @PostMapping("/majors")
    @Operation(summary = "Create major config", description = "Adds a new major config to the system.")
    public ResponseEntity<ApiResponse<Major>> createMajor(@Valid @RequestBody MajorRequest request) {
        Major response = adminService.createMajor(request);
        return ResponseEntity.ok(ApiResponse.ok("Major created successfully", response));
    }

    @PutMapping("/majors/{id}")
    @Operation(summary = "Update major config", description = "Updates major properties by ID.")
    public ResponseEntity<ApiResponse<Major>> updateMajor(@PathVariable Long id, @Valid @RequestBody MajorRequest request) {
        Major response = adminService.updateMajor(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Major updated successfully", response));
    }

    @DeleteMapping("/majors/{id}")
    @Operation(summary = "Delete major config", description = "Deletes major configuration from the system.")
    public ResponseEntity<ApiResponse<String>> deleteMajor(@PathVariable Long id) {
        adminService.deleteMajor(id);
        return ResponseEntity.ok(ApiResponse.ok("Major deleted successfully"));
    }

    // --- Courses CRUD
    @GetMapping("/courses")
    @Operation(summary = "List all courses config", description = "Retrieves all course configurations in the system.")
    public ResponseEntity<ApiResponse<List<Course>>> getAllCourses() {
        return ResponseEntity.ok(ApiResponse.ok("Courses retrieved successfully", adminService.getAllCourses()));
    }

    @PostMapping("/courses")
    @Operation(summary = "Create course config", description = "Adds a new course configuration linked to a Major.")
    public ResponseEntity<ApiResponse<Course>> createCourse(@Valid @RequestBody CourseRequest request) {
        Course response = adminService.createCourse(request);
        return ResponseEntity.ok(ApiResponse.ok("Course created successfully", response));
    }

    @PutMapping("/courses/{id}")
    @Operation(summary = "Update course config", description = "Updates course properties by ID.")
    public ResponseEntity<ApiResponse<Course>> updateCourse(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        Course response = adminService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Course updated successfully", response));
    }

    @DeleteMapping("/courses/{id}")
    @Operation(summary = "Delete course config", description = "Deletes a course config by ID.")
    public ResponseEntity<ApiResponse<String>> deleteCourse(@PathVariable Long id) {
        adminService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.ok("Course deleted successfully"));
    }

    // --- Categories CRUD
    @GetMapping("/categories")
    @Operation(summary = "List all document categories", description = "Retrieves all document categories.")
    public ResponseEntity<ApiResponse<List<DocumentCategory>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok("Categories retrieved successfully", adminService.getAllCategories()));
    }

    @PostMapping("/categories")
    @Operation(summary = "Create document category", description = "Adds a new category name.")
    public ResponseEntity<ApiResponse<DocumentCategory>> createCategory(@Valid @RequestBody CategoryRequest request) {
        DocumentCategory response = adminService.createCategory(request);
        return ResponseEntity.ok(ApiResponse.ok("Category created successfully", response));
    }

    @PutMapping("/categories/{id}")
    @Operation(summary = "Update document category", description = "Updates category name by ID.")
    public ResponseEntity<ApiResponse<DocumentCategory>> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        DocumentCategory response = adminService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Category updated successfully", response));
    }

    @DeleteMapping("/categories/{id}")
    @Operation(summary = "Delete document category", description = "Deletes a document category by ID.")
    public ResponseEntity<ApiResponse<String>> deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.ok("Category deleted successfully"));
    }

    // --- Subscription Plans CRUD
    @GetMapping("/plans")
    @Operation(summary = "List all plans config", description = "Retrieves all subscription plans configs in the system.")
    public ResponseEntity<ApiResponse<List<SubscriptionPlan>>> getAllPlans() {
        return ResponseEntity.ok(ApiResponse.ok("Subscription plans retrieved successfully", adminService.getAllPlans()));
    }

    @PostMapping("/plans")
    @Operation(summary = "Create plan config", description = "Adds a new subscription plan with specific limits and price.")
    public ResponseEntity<ApiResponse<SubscriptionPlan>> createPlan(@Valid @RequestBody SubscriptionPlanRequest request) {
        SubscriptionPlan response = adminService.createPlan(request);
        return ResponseEntity.ok(ApiResponse.ok("Subscription plan created successfully", response));
    }

    @PutMapping("/plans/{id}")
    @Operation(summary = "Update plan config", description = "Updates subscription plan limits and prices by ID.")
    public ResponseEntity<ApiResponse<SubscriptionPlan>> updatePlan(@PathVariable Long id, @Valid @RequestBody SubscriptionPlanRequest request) {
        SubscriptionPlan response = adminService.updatePlan(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Subscription plan updated successfully", response));
    }

    @DeleteMapping("/plans/{id}")
    @Operation(summary = "Delete plan config", description = "Deletes plan configuration by ID.")
    public ResponseEntity<ApiResponse<String>> deletePlan(@PathVariable Long id) {
        adminService.deletePlan(id);
        return ResponseEntity.ok(ApiResponse.ok("Subscription plan deleted successfully"));
    }
}
