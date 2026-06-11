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
import com.studyhub.document.entity.Folder;
import com.studyhub.document.entity.Tag;
import com.studyhub.document.repository.DocumentCategoryRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.FolderRepository;
import com.studyhub.document.repository.TagRepository;
import com.studyhub.storage.service.FirebaseStorageService;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
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
    private final FirebaseStorageService storageService;

    @Transactional
    public DocumentResponse uploadDocument(MultipartFile file, DocumentUploadRequest request, String userEmail) throws IOException {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate File
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

        // Validate Parent Folder
        Folder folder = null;
        if (request.getFolderId() != null) {
            folder = folderRepository.findById(request.getFolderId())
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found"));
            if (!folder.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Permission denied for folder");
            }
        }

        // Validate Course
        Course course = null;
        if (request.getCourseId() != null) {
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new IllegalArgumentException("Course not found"));
        }

        // Validate Category
        DocumentCategory category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
        }

        // Handle Tags
        Set<Tag> tags = new HashSet<>();
        if (request.getTags() != null) {
            for (String tagName : request.getTags()) {
                Tag tag = tagRepository.findByTagName(tagName)
                        .orElseGet(() -> tagRepository.save(Tag.builder().tagName(tagName).build()));
                tags.add(tag);
            }
        }

        // Upload to Firebase Storage
        String fileUrl = storageService.uploadFile(file, "documents");

        // Build and Save Document
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
                .visibility(request.getVisibility() != null ? request.getVisibility() : Visibility.PUBLIC)
                .moderationStatus(ModerationStatus.APPROVED) // Auto approved for development/testing
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

    @Transactional(readOnly = true)
    public DocumentResponse getDocumentDetails(Long documentId, String userEmail) {
        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (doc.getVisibility() == Visibility.PRIVATE) {
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            if (!doc.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Permission denied for private document");
            }
        }

        return mapToResponse(doc);
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

        // Delete from Firebase storage first
        storageService.deleteFile(doc.getFileUrl());

        documentRepository.delete(doc);
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
                .build();
    }
}
