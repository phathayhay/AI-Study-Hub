package com.studyhub.document.service;

import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.document.dto.DocumentResponse;
import com.studyhub.document.dto.FolderRequest;
import com.studyhub.document.dto.FolderResponse;
import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.Folder;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.document.repository.FolderRepository;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FolderService {

    private final FolderRepository folderRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    @Transactional
    public FolderResponse createFolder(FolderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder parentFolder = null;
        if (request.getParentFolderId() != null) {
            parentFolder = folderRepository.findById(request.getParentFolderId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent folder not found"));

            if (!parentFolder.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Permission denied for parent folder");
            }
        }

        // Check unique constraint: user_id, parent_folder_id, folder_name
        boolean exists;
        if (parentFolder != null) {
            exists = folderRepository.findByUserIdAndParentFolderIdAndFolderName(
                    user.getId(), parentFolder.getId(), request.getFolderName()).isPresent();
        } else {
            exists = folderRepository.findByUserIdAndParentFolderIsNullAndFolderName(
                    user.getId(), request.getFolderName()).isPresent();
        }

        if (exists) {
            throw new IllegalArgumentException("Folder with name '" + request.getFolderName() + "' already exists in this directory");
        }

        Folder folder = Folder.builder()
                .folderName(request.getFolderName())
                .parentFolder(parentFolder)
                .user(user)
                .visibility(Visibility.PRIVATE)
                .build();

        Folder savedFolder = folderRepository.save(folder);
        return mapToResponse(savedFolder, false);
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> getRootFolders(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return folderRepository.findByUserIdAndParentFolderIdIsNull(user.getId()).stream()
                .map(folder -> mapToResponse(folder, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FolderResponse getFolderDetails(Long folderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder folder = getOwnedFolder(folderId, user.getId());

        return mapToResponse(folder, true);
    }

    @Transactional(readOnly = true)
    public List<FolderResponse> getPublishedFolders() {
        return folderRepository.findByVisibilityOrderByUpdatedAtDesc(Visibility.PUBLIC).stream()
                .filter(this::isFolderPublishReady)
                .map(folder -> mapToPublicResponse(folder, false))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public FolderResponse getPublishedFolderDetails(Long folderId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        if (folder.getVisibility() != Visibility.PUBLIC || !isFolderPublishReady(folder)) {
            throw new IllegalArgumentException("Folder not found");
        }

        return mapToPublicResponse(folder, true);
    }

    @Transactional
    public FolderResponse renameFolder(Long folderId, FolderRequest request, Map<String, Object> rawPayload, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder folder = getOwnedFolder(folderId, user.getId());

        // Update name if provided
        if (request.getFolderName() != null && !request.getFolderName().isBlank()) {
            Folder targetParent = folder.getParentFolder();
            if (rawPayload != null && rawPayload.containsKey("parentFolderId")) {
                Object pId = rawPayload.get("parentFolderId");
                if (pId != null) {
                    Long targetParentId = Long.valueOf(pId.toString());
                    targetParent = folderRepository.findById(targetParentId).orElse(null);
                } else {
                    targetParent = null;
                }
            }

            boolean exists;
            if (targetParent != null) {
                exists = folderRepository.findByUserIdAndParentFolderIdAndFolderName(
                        user.getId(), targetParent.getId(), request.getFolderName())
                        .filter(f -> !f.getId().equals(folderId)).isPresent();
            } else {
                exists = folderRepository.findByUserIdAndParentFolderIsNullAndFolderName(
                        user.getId(), request.getFolderName())
                        .filter(f -> !f.getId().equals(folderId)).isPresent();
            }

            if (exists) {
                throw new IllegalArgumentException("Folder with name '" + request.getFolderName() + "' already exists in this directory");
            }

            folder.setFolderName(request.getFolderName());
        }

        // Update parent folder (move folder) if parentFolderId key is present
        if (rawPayload != null && rawPayload.containsKey("parentFolderId")) {
            Object parentIdVal = rawPayload.get("parentFolderId");
            if (parentIdVal == null) {
                folder.setParentFolder(null);
            } else {
                Long parentFolderId = Long.valueOf(parentIdVal.toString());
                if (parentFolderId.equals(folderId)) {
                    throw new IllegalArgumentException("Cannot move a folder into itself");
                }

                // Check for cyclical relationship: parentFolderId must not be a subfolder of folderId
                Long currentParentId = parentFolderId;
                while (currentParentId != null) {
                    if (currentParentId.equals(folderId)) {
                        throw new IllegalArgumentException("Cannot move a folder into its own subfolder");
                    }
                    Folder tempParent = folderRepository.findById(currentParentId).orElse(null);
                    currentParentId = (tempParent != null && tempParent.getParentFolder() != null) ? tempParent.getParentFolder().getId() : null;
                }

                Folder newParent = folderRepository.findById(parentFolderId)
                        .orElseThrow(() -> new IllegalArgumentException("Target parent folder not found"));

                if (!newParent.getUser().getId().equals(user.getId())) {
                    throw new SecurityException("Permission denied for target parent folder");
                }
                folder.setParentFolder(newParent);
            }
        }

        Folder savedFolder = folderRepository.save(folder);
        return mapToResponse(savedFolder, false);
    }

    @Transactional
    public FolderResponse updateVisibility(Long folderId, Visibility visibility, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder folder = getOwnedFolder(folderId, user.getId());
        Visibility nextVisibility = visibility != null ? visibility : Visibility.PRIVATE;

        if (nextVisibility == Visibility.PUBLIC) {
            if (!Boolean.TRUE.equals(user.getPlan().getCanPublishFolders())) {
                throw new IllegalArgumentException("Your current plan does not allow publishing folders.");
            }
            validateFolderCanBePublished(folder);
            folder.setVisibility(Visibility.PUBLIC);
            if (folder.getPublishedAt() == null) {
                folder.setPublishedAt(LocalDateTime.now());
            }
        } else {
            folder.setVisibility(Visibility.PRIVATE);
            folder.setPublishedAt(null);
        }

        return mapToResponse(folderRepository.save(folder), true);
    }

    @Transactional
    public void deleteFolder(Long folderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder folder = getOwnedFolder(folderId, user.getId());

        folderRepository.delete(folder);
    }

    private FolderResponse mapToResponse(Folder folder, boolean includeContents) {
        List<Document> documents = documentRepository.findByFolderId(folder.getId());
        return buildFolderResponse(folder, documents, includeContents, false);
    }

    private FolderResponse mapToPublicResponse(Folder folder, boolean includeContents) {
        List<Document> documents = filterFolderAccessibleDocuments(documentRepository.findByFolderId(folder.getId()));
        return buildFolderResponse(folder, documents, includeContents, true);
    }

    private FolderResponse buildFolderResponse(Folder folder, List<Document> documents, boolean includeContents, boolean publicView) {
        boolean publishReady = isPublishReady(documents);
        String blockedReason = publishReady ? null : buildPublishBlockedReason(documents);
        int totalDownloads = documents.stream()
                .mapToInt(doc -> doc.getTotalDownloads() != null ? doc.getTotalDownloads() : 0)
                .sum();

        FolderResponse response = FolderResponse.builder()
                .id(folder.getId())
                .userId(folder.getUser().getId())
                .ownerName(folder.getUser().getFullName())
                .folderName(folder.getFolderName())
                .parentFolderId(folder.getParentFolder() != null ? folder.getParentFolder().getId() : null)
                .visibility(folder.getVisibility() != null ? folder.getVisibility().name() : Visibility.PRIVATE.name())
                .publishedAt(folder.getPublishedAt())
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .publicDocumentCount(filterFolderAccessibleDocuments(documents).size())
                .totalDownloads(totalDownloads)
                .courseIds(documents.stream()
                        .filter(doc -> doc.getCourse() != null)
                        .map(doc -> doc.getCourse().getId())
                        .collect(Collectors.toSet()))
                .categoryIds(documents.stream()
                        .filter(doc -> doc.getCategory() != null)
                        .map(doc -> doc.getCategory().getId())
                        .collect(Collectors.toSet()))
                .semesters(documents.stream()
                        .map(Document::getSemester)
                        .filter(semester -> semester != null && !semester.isBlank())
                        .collect(Collectors.toSet()))
                .publishReady(publishReady)
                .publishBlockedReason(blockedReason)
                .build();

        if (includeContents) {
            List<FolderResponse> subfolders = publicView
                    ? List.of()
                    : folderRepository.findByParentFolderId(folder.getId()).stream()
                        .map(f -> mapToResponse(f, false))
                        .collect(Collectors.toList());

            List<DocumentResponse> documentResponses = documents.stream()
                    .map(this::mapDocumentToResponse)
                    .collect(Collectors.toList());

            response.setSubfolders(subfolders);
            response.setDocuments(documentResponses);
        }

        return response;
    }

    private Folder getOwnedFolder(Long folderId, Long userId) {
        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        if (!folder.getUser().getId().equals(userId)) {
            throw new SecurityException("Permission denied");
        }

        return folder;
    }

    private void validateFolderCanBePublished(Folder folder) {
        List<Document> documents = documentRepository.findByFolderId(folder.getId());
        if (documents.isEmpty()) {
            throw new IllegalArgumentException("Only folders with at least one document can be published.");
        }

        String blockedReason = buildPublishBlockedReason(documents);
        if (blockedReason != null) {
            throw new IllegalArgumentException(blockedReason);
        }
    }

    private boolean isFolderPublishReady(Folder folder) {
        return folder.getVisibility() == Visibility.PUBLIC
                && isPublishReady(documentRepository.findByFolderId(folder.getId()));
    }

    private boolean isPublishReady(List<Document> documents) {
        return !documents.isEmpty() && documents.stream().allMatch(this::isFolderAccessibleDocument);
    }

    private List<Document> filterFolderAccessibleDocuments(List<Document> documents) {
        return documents.stream()
                .filter(this::isFolderAccessibleDocument)
                .collect(Collectors.toList());
    }

    private boolean isFolderAccessibleDocument(Document document) {
        return document.getModerationStatus() == ModerationStatus.APPROVED;
    }

    private String buildPublishBlockedReason(List<Document> documents) {
        if (documents.isEmpty()) {
            return "This folder is empty. Add at least one approved document before publishing.";
        }

        List<String> blockedTitles = documents.stream()
                .filter(doc -> !isFolderAccessibleDocument(doc))
                .map(doc -> doc.getTitle() != null && !doc.getTitle().isBlank() ? doc.getTitle() : doc.getFileName())
                .collect(Collectors.toList());

        if (blockedTitles.isEmpty()) {
            return null;
        }

        return "All documents in a public folder must be APPROVED. Fix: "
                + String.join(", ", blockedTitles);
    }

    private DocumentResponse mapDocumentToResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .userId(doc.getUser().getId())
                .title(doc.getTitle())
                .description(doc.getDescription())
                .semester(doc.getSemester())
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
                .tags(doc.getTags().stream().map(t -> t.getTagName()).collect(Collectors.toSet()))
                .uploader(doc.getUser().getFullName())
                .build();
    }
}
