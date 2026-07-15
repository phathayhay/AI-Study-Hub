package com.studyhub.document.service;

import com.studyhub.common.enums.FileType;
import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.course.entity.Course;
import com.studyhub.course.repository.CourseRepository;
import com.studyhub.document.dto.DocumentResponse;
import com.studyhub.document.dto.DocumentUploadRequest;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.DocumentCategory;
import com.studyhub.document.entity.DocumentDownload;
import com.studyhub.document.entity.DocumentView;
import com.studyhub.document.entity.Folder;
import com.studyhub.document.entity.Tag;
import com.studyhub.document.repository.DocumentCategoryRepository;
import com.studyhub.document.repository.DocumentDownloadRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.DocumentSpecifications;
import com.studyhub.document.repository.DocumentViewRepository;
import com.studyhub.document.repository.FolderRepository;
import com.studyhub.document.repository.TagRepository;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final FolderRepository folderRepository;
    private final CourseRepository courseRepository;
    private final DocumentCategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final CloudinaryStorageService storageService;
    private final DocumentViewRepository documentViewRepository;
    private final DocumentDownloadRepository documentDownloadRepository;
    private final SubscriptionService subscriptionService;

    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, DocumentUploadRequest request, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        validateStorageQuota(user, file.getSize());

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toUpperCase();
        FileType fileType;
        try {
            fileType = FileType.valueOf(extension);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported file type: " + extension);
        }

        Folder folder = null;
        if (request.getFolderId() != null) {
            folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
            if (!folder.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Permission denied for folder");
            }
        }

        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        }

        DocumentCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        }

        Set<Tag> tags = new HashSet<>();
        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                Tag tag = tagRepository.findByTagName(tagName)
                        .orElseGet(() -> tagRepository.save(Tag.builder().tagName(tagName).build()));
                tags.add(tag);
            }
        }

        String fileUrl = storageService.uploadFile(file, "documents");

        Document doc = Document.builder()
                .user(user)
                .course(course)
                .category(category)
                .folder(folder)
                .title(request.getTitle())
                .description(request.getDescription())
                .fileName(originalFilename)
                .fileUrl(fileUrl)
                .fileSize(file.getSize())
                .fileType(fileType)
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PRIVATE)
                .moderationStatus(ModerationStatus.APPROVED)
                .averageRating(BigDecimal.ZERO)
                .totalViews(0)
                .totalDownloads(0)
                .tags(tags)
                .build();

        Document savedDoc = documentRepository.save(doc);
        log.info("Saved document '{}' in DB, URL: {}", savedDoc.getTitle(), savedDoc.getFileUrl());

        return mapToResponse(savedDoc);
    }

    @Transactional
    public DocumentResponse moveDocument(Long documentId, Long folderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!doc.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Permission denied");
        }

        Folder folder = null;
        if (folderId != null) {
            folder = folderRepository.findById(folderId)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
            if (!folder.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Permission denied for target folder");
            }
        }

        doc.setFolder(folder);
        Document savedDoc = documentRepository.save(doc);
        return mapToResponse(savedDoc);
    }

    @Transactional
    public DocumentResponse getDocumentDetails(Long documentId, String userEmail) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        User user = null;
        if (userEmail != null) {
            user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
        }

        if (!canAccessDocument(doc, user)) {
            throw new SecurityException("Permission denied for private document");
        }

        doc.setTotalViews(doc.getTotalViews() + 1);
        documentRepository.save(doc);

        DocumentView view = DocumentView.builder()
                .document(doc)
                .user(user)
                .build();
        documentViewRepository.save(view);

        return mapToResponse(doc);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> searchDocuments(String keyword, Long majorId, Long courseId, Long categoryId, Pageable pageable) {
        Specification<Document> spec = Specification.where(DocumentSpecifications.isPublicAndApproved())
                .and(DocumentSpecifications.hasKeyword(keyword))
                .and(DocumentSpecifications.hasMajorId(majorId))
                .and(DocumentSpecifications.hasCourseId(courseId))
                .and(DocumentSpecifications.hasCategoryId(categoryId));

        Page<Document> docs = documentRepository.findAll(spec, pageable);
        return docs.map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> getViewHistory(String userEmail, Pageable pageable) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Page<Document> recentlyViewed = documentViewRepository.findRecentlyViewedDocuments(user.getId(), pageable);
        return recentlyViewed.map(this::mapToResponse);
    }

    @Transactional
    public DocumentResponse updateVisibility(Long documentId, Visibility visibility, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!doc.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Ban khong co quyen thay doi trang thai chia se cua tai lieu nay");
        }

        if (visibility == Visibility.PUBLIC && !Boolean.TRUE.equals(user.getPlan().getCanPublishDocuments())) {
            throw new IllegalArgumentException("Your current plan does not allow publishing documents.");
        }

        doc.setVisibility(visibility);
        Document savedDoc = documentRepository.save(doc);
        log.info("Document ID {} visibility updated to {} by user {}", documentId, visibility, userEmail);
        return mapToResponse(savedDoc);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getUserDocuments(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return documentRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteDocument(Long documentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!doc.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Permission denied");
        }

        storageService.deleteFile(doc.getFileUrl());
        documentRepository.delete(doc);
        documentRepository.flush();
        subscriptionService.syncStorageStatus(user);
        userRepository.save(user);
    }

    @Transactional
    public ResponseEntity<ByteArrayResource> downloadDocument(Long documentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!canAccessDocument(doc, user)) {
            throw new SecurityException("You are not allowed to download this document");
        }

        String downloadFileName = doc.getFileName() != null && !doc.getFileName().isBlank()
                ? doc.getFileName()
                : doc.getTitle();

        byte[] fileBytes;
        try (InputStream inputStream = URI.create(doc.getFileUrl()).toURL().openStream()) {
            fileBytes = inputStream.readAllBytes();
        } catch (IOException | RuntimeException e) {
            log.error("Failed to fetch downloadable file for document {}: {}", documentId, e.getMessage());
            throw new IllegalStateException("Download failed. Please try again.");
        }

        int updatedRows = documentRepository.incrementTotalDownloads(documentId);
        if (updatedRows != 1) {
            throw new IllegalStateException("Download failed. Please try again.");
        }

        DocumentDownload download = DocumentDownload.builder()
                .document(doc)
                .user(user)
                .build();
        documentDownloadRepository.save(download);

        String detectedContentType = URLConnection.guessContentTypeFromName(downloadFileName);
        if (detectedContentType == null) {
            try (ByteArrayInputStream sniffStream = new ByteArrayInputStream(fileBytes)) {
                detectedContentType = URLConnection.guessContentTypeFromStream(sniffStream);
            } catch (IOException ignored) {
                detectedContentType = null;
            }
        }

        MediaType mediaType;
        try {
            mediaType = detectedContentType != null
                    ? MediaType.parseMediaType(detectedContentType)
                    : MediaType.APPLICATION_OCTET_STREAM;
        } catch (Exception ignored) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        ContentDisposition contentDisposition = ContentDisposition.attachment()
                .filename(downloadFileName, StandardCharsets.UTF_8)
                .build();

        log.info("Document ID {} downloaded by user {}", documentId, userEmail);
        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(fileBytes.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition.toString())
                .body(new ByteArrayResource(fileBytes));
    }

    public boolean canAccessDocument(Document document, User user) {
        if (user != null && document.getUser() != null && document.getUser().getId().equals(user.getId())) {
            return true;
        }

        return isDocumentPubliclyAccessible(document);
    }

    public boolean isDocumentPubliclyAccessible(Document document) {
        if (document.getModerationStatus() != ModerationStatus.APPROVED) {
            return false;
        }

        if (document.getVisibility() == Visibility.PUBLIC) {
            return true;
        }

        Folder folder = document.getFolder();
        return folder != null && folder.getVisibility() == Visibility.PUBLIC;
    }

    private void validateStorageQuota(User user, long incomingFileSizeBytes) {
        subscriptionService.validateUploadAllowed(user, incomingFileSizeBytes);
    }

    public DocumentResponse mapToResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .userId(doc.getUser().getId())
                .title(doc.getTitle())
                .description(doc.getDescription())
                .fileName(doc.getFileName())
                .fileUrl(doc.getFileUrl())
                .thumbnailUrl(doc.getThumbnailUrl())
                .fileSize(doc.getFileSize())
                .fileType(doc.getFileType().name())
                .visibility(doc.getVisibility().name())
                .moderationStatus(doc.getModerationStatus().name())
                .averageRating(doc.getAverageRating())
                .totalViews(doc.getTotalViews())
                .totalDownloads(doc.getTotalDownloads())
                .createdAt(doc.getCreatedAt())
                .updatedAt(doc.getUpdatedAt())
                .folderId(doc.getFolder() != null ? doc.getFolder().getId() : null)
                .courseId(doc.getCourse() != null ? doc.getCourse().getId() : null)
                .categoryId(doc.getCategory() != null ? doc.getCategory().getId() : null)
                .tags(doc.getTags().stream().map(Tag::getTagName).collect(Collectors.toSet()))
                .uploader(doc.getUser().getFullName())
                .build();
    }
}
