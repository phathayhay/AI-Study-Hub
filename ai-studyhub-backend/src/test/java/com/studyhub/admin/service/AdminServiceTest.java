package com.studyhub.admin.service;

import com.studyhub.admin.dto.*;
import com.studyhub.common.enums.*;
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
import com.studyhub.document.service.DocumentService;
import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.course.dto.CourseListResponse;
import com.studyhub.course.service.CourseService;
import com.studyhub.user.service.NotificationService;
import com.studyhub.user.service.SubscriptionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private StudentVerificationRepository studentVerificationRepository;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private MajorRepository majorRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private DocumentCategoryRepository documentCategoryRepository;
    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock
    private CourseService courseService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private SubscriptionService subscriptionService;
    @Mock
    private DocumentService documentService;
    @Mock
    private AdminVerificationService adminVerificationService;
    @Mock
    private AdminAnalyticsService adminAnalyticsService;

    @InjectMocks
    private AdminService adminService;

    private User mockUser;
    private User mockAdmin;
    private Major mockMajor;
    private Course mockCourse;
    private DocumentCategory mockCategory;
    private SubscriptionPlan mockPlan;
    private Document mockDocument;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .email("student@fpt.edu.vn")
                .firstName("Student")
                .lastName("FPT")
                .status(UserStatus.INACTIVE)
                .verificationStatus(VerificationStatus.PENDING)
                .role(new Role(null, "USER"))
                .build();

        mockAdmin = User.builder()
                .id(2L)
                .email("admin@fpt.edu.vn")
                .firstName("Admin")
                .lastName("System")
                .role(new Role(null, "ADMIN"))
                .build();

        mockMajor = Major.builder()
                .id(10L)
                .majorCode("SE")
                .majorName("Software Engineering")
                .build();

        mockCourse = Course.builder()
                .id(20L)
                .courseCode("PRJ301")
                .courseName("Java Web Application Development")
                .major(mockMajor)
                .isActive(true)
                .build();

        mockCategory = DocumentCategory.builder()
                .id(30L)
                .categoryName("Exam Preparation")
                .build();

        mockPlan = SubscriptionPlan.builder()
                .id(40L)
                .planName("PRO")
                .price(BigDecimal.valueOf(29000))
                .storageLimitMb(5120L)
                .aiRequestsPerDay(100)
                .isActive(true)
                .build();

        mockDocument = Document.builder()
                .id(50L)
                .title("PRJ301 Past Exam Paper")
                .fileName("prj301_exam.pdf")
                .fileSize(102400L)
                .visibility(Visibility.PUBLIC)
                .moderationStatus(ModerationStatus.PENDING)
                .user(mockUser)
                .averageRating(BigDecimal.ZERO)
                .build();
    }

    // ── 1. User Management Tests

    @Test
    void testGetAllUsers() {
        when(userRepository.findAll()).thenReturn(List.of(mockUser));
        List<AdminUserResponse> response = adminService.getAllUsers();
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("student@fpt.edu.vn", response.get(0).getEmail());
    }

    @Test
    void testBanUser() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        adminService.banUser(1L);
        assertEquals(UserStatus.BANNED, mockUser.getStatus());
        verify(userRepository, times(1)).save(mockUser);
    }

    @Test
    void testUnbanUser() {
        mockUser.setStatus(UserStatus.BANNED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        adminService.unbanUser(1L);
        assertEquals(UserStatus.ACTIVE, mockUser.getStatus());
        verify(userRepository, times(1)).save(mockUser);
    }

    // ── 2. Verification Review Tests

    @Test
    void testGetPendingVerifications() {
        AdminVerificationResponse pending = AdminVerificationResponse.builder()
                .id(100L)
                .imageUrl("https://cloud.com/card.png")
                .build();
        when(adminVerificationService.getPendingVerifications()).thenReturn(List.of(pending));

        List<AdminVerificationResponse> response = adminService.getPendingVerifications();
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("https://cloud.com/card.png", response.get(0).getImageUrl());
        verify(adminVerificationService).getPendingVerifications();
    }

    @Test
    void testReviewVerification_Approve() {
        StudentVerification requestVerification = StudentVerification.builder()
                .id(100L)
                .user(mockUser)
                .imageUrl("https://cloud.com/card.png")
                .status(VerificationStatus.PENDING)
                .build();

        VerificationReviewRequest reviewDto = VerificationReviewRequest.builder()
                .status("APPROVED")
                .reviewNote("Identity confirmed")
                .build();

        adminService.reviewVerification(100L, reviewDto, "admin@fpt.edu.vn");

        verify(adminVerificationService).reviewVerification(100L, reviewDto, "admin@fpt.edu.vn");
    }

    @Test
    void testReviewVerification_Reject() {
        StudentVerification requestVerification = StudentVerification.builder()
                .id(100L)
                .user(mockUser)
                .imageUrl("https://cloud.com/card.png")
                .status(VerificationStatus.PENDING)
                .build();

        VerificationReviewRequest reviewDto = VerificationReviewRequest.builder()
                .status("REJECTED")
                .reviewNote("Blurry photo")
                .build();

        adminService.reviewVerification(100L, reviewDto, "admin@fpt.edu.vn");

        verify(adminVerificationService).reviewVerification(100L, reviewDto, "admin@fpt.edu.vn");
    }

    // ── 3. Document Moderation & Reports Tests

    @Test
    void testGetAllDocuments() {
        when(documentRepository.findAll()).thenReturn(List.of(mockDocument));
        List<AdminDocumentResponse> response = adminService.getAllDocuments();
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("PRJ301 Past Exam Paper", response.get(0).getTitle());
    }

    @Test
    void testModerateDocument() {
        when(documentRepository.findById(50L)).thenReturn(Optional.of(mockDocument));
        DocumentModerationRequest request = DocumentModerationRequest.builder()
                .status("APPROVED")
                .build();

        adminService.moderateDocument(50L, request);

        assertEquals(ModerationStatus.APPROVED, mockDocument.getModerationStatus());
        verify(documentRepository, times(1)).save(mockDocument);
    }

    @Test
    void testGetAllReports() {
        Report report = Report.builder()
                .id(300L)
                .reporter(mockAdmin)
                .document(mockDocument)
                .reportType(ReportType.SPAM)
                .status(ReportStatus.PENDING)
                .reportReason("Irrelevant spam document")
                .build();

        when(reportRepository.findAll()).thenReturn(List.of(report));

        List<AdminReportResponse> response = adminService.getAllReports();
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("Irrelevant spam document", response.get(0).getReportReason());
    }

    @Test
    void testResolveReport_WithDocumentDeletion() {
        Report report = Report.builder()
                .id(300L)
                .reporter(mockAdmin)
                .document(mockDocument)
                .reportType(ReportType.SPAM)
                .status(ReportStatus.PENDING)
                .build();

        when(reportRepository.findById(300L)).thenReturn(Optional.of(report));

        ReportResolveRequest request = ReportResolveRequest.builder()
                .status("RESOLVED")
                .deleteDocument(true)
                .build();

        adminService.resolveReport(300L, request);

        assertEquals(ReportStatus.RESOLVED, report.getStatus());
        assertEquals(ModerationStatus.REJECTED, mockDocument.getModerationStatus());
        verify(reportRepository, times(1)).save(report);
        verify(documentRepository, times(1)).save(mockDocument);
    }

    // ── 4. Configuration CRUD Tests

    @Test
    void testCRUDMajors() {
        MajorRequest req = MajorRequest.builder().majorCode("se").majorName("Software Engineering").build();
        when(courseService.createMajor(req)).thenReturn(mockMajor);
        assertSame(mockMajor, adminService.createMajor(req));

        when(courseService.getAllMajors()).thenReturn(List.of(mockMajor));
        List<Major> list = adminService.getAllMajors();
        assertEquals(1, list.size());

        MajorRequest updateReq = MajorRequest.builder().majorName("New Software Engineering").build();
        when(courseService.updateMajor(10L, updateReq)).thenReturn(mockMajor);
        assertSame(mockMajor, adminService.updateMajor(10L, updateReq));

        adminService.deleteMajor(10L);
        verify(courseService).deleteMajor(10L);
    }

    @Test
    void testCRUDCourses() {
        CourseListResponse courseResponse = new CourseListResponse();
        CourseRequest req = CourseRequest.builder().courseCode("PRJ301").courseName("Java Web").majorId(10L).isActive(true).build();
        when(courseService.createCourse(req)).thenReturn(courseResponse);
        assertSame(courseResponse, adminService.createCourse(req));

        when(courseService.getAllCourses()).thenReturn(List.of(courseResponse));
        List<CourseListResponse> list = adminService.getAllCourses();
        assertEquals(1, list.size());

        CourseRequest updateReq = CourseRequest.builder().courseName("New Java Web").majorId(10L).isActive(false).build();
        when(courseService.updateCourse(20L, updateReq)).thenReturn(courseResponse);
        assertSame(courseResponse, adminService.updateCourse(20L, updateReq));

        adminService.deleteCourse(20L);
        verify(courseService).deleteCourse(20L);
    }
}
