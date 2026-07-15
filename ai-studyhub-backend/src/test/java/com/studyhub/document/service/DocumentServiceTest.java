package com.studyhub.document.service;

import com.studyhub.common.StorageQuotaExceededException;
import com.studyhub.common.enums.FileType;
import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.document.dto.DocumentUploadRequest;
import com.studyhub.document.entity.Document;
import com.studyhub.document.repository.DocumentCategoryRepository;
import com.studyhub.document.repository.DocumentDownloadRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.DocumentViewRepository;
import com.studyhub.document.repository.FolderRepository;
import com.studyhub.document.repository.TagRepository;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.service.SubscriptionService;
import com.studyhub.course.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FolderRepository folderRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private DocumentCategoryRepository categoryRepository;
    @Mock
    private TagRepository tagRepository;
    @Mock
    private CloudinaryStorageService storageService;
    @Mock
    private DocumentViewRepository documentViewRepository;
    @Mock
    private DocumentDownloadRepository documentDownloadRepository;
    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private DocumentService documentService;

    private User user;

    @BeforeEach
    void setUp() {
        SubscriptionPlan freePlan = SubscriptionPlan.builder()
                .id(1L)
                .planName("FREE")
                .price(BigDecimal.ZERO)
                .storageLimitMb(50L)
                .build();

        user = User.builder()
                .id(10L)
                .email("student@fpt.edu.vn")
                .firstName("Student")
                .lastName("FPT")
                .plan(freePlan)
                .build();
    }

    @Test
    void uploadDocument_ShouldRejectWhenUserIsOverQuota() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "quota-test.pdf",
                "application/pdf",
                "demo".getBytes()
        );
        DocumentUploadRequest request = new DocumentUploadRequest();
        request.setTitle("Quota Test");
        request.setVisibility(Visibility.PRIVATE);

        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(user));
        doThrow(new StorageQuotaExceededException("Storage limit exceeded. Delete existing files or upgrade your plan."))
                .when(subscriptionService)
                .validateUploadAllowed(eq(user), eq(file.getSize()));

        assertThrows(
                StorageQuotaExceededException.class,
                () -> documentService.uploadDocument(file, request, "student@fpt.edu.vn")
        );

        verify(storageService, never()).uploadFile(any(), any());
        verify(documentRepository, never()).save(any(Document.class));
    }

    @Test
    void deleteDocument_ShouldRecalculateStorageStatusAfterDelete() {
        Document document = Document.builder()
                .id(99L)
                .user(user)
                .title("Old file")
                .fileName("old-file.pdf")
                .fileUrl("https://example.com/old-file.pdf")
                .fileSize(1024L)
                .fileType(FileType.PDF)
                .visibility(Visibility.PRIVATE)
                .moderationStatus(ModerationStatus.APPROVED)
                .averageRating(BigDecimal.ZERO)
                .totalViews(0)
                .totalDownloads(0)
                .build();

        when(userRepository.findByEmail("student@fpt.edu.vn")).thenReturn(Optional.of(user));
        when(documentRepository.findById(99L)).thenReturn(Optional.of(document));

        documentService.deleteDocument(99L, "student@fpt.edu.vn");

        verify(storageService).deleteFile("https://example.com/old-file.pdf");
        verify(documentRepository).delete(document);
        verify(subscriptionService).syncStorageStatus(user);
        verify(userRepository).save(user);
    }
}
