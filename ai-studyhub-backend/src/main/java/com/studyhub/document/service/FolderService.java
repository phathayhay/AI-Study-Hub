package com.studyhub.document.service;

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

import java.util.List;
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

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Permission denied");
        }

        return mapToResponse(folder, true);
    }

    @Transactional
    public FolderResponse renameFolder(Long folderId, FolderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Permission denied");
        }

        // Check duplicate name
        boolean exists;
        Folder parentFolder = folder.getParentFolder();
        if (parentFolder != null) {
            exists = folderRepository.findByUserIdAndParentFolderIdAndFolderName(
                    user.getId(), parentFolder.getId(), request.getFolderName())
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
        Folder savedFolder = folderRepository.save(folder);
        return mapToResponse(savedFolder, false);
    }

    @Transactional
    public void deleteFolder(Long folderId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Folder folder = folderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found"));

        if (!folder.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Permission denied");
        }

        folderRepository.delete(folder);
    }

    private FolderResponse mapToResponse(Folder folder, boolean includeContents) {
        FolderResponse response = FolderResponse.builder()
                .id(folder.getId())
                .userId(folder.getUser().getId())
                .folderName(folder.getFolderName())
                .parentFolderId(folder.getParentFolder() != null ? folder.getParentFolder().getId() : null)
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .build();

        if (includeContents) {
            List<FolderResponse> subfolders = folderRepository.findByParentFolderId(folder.getId()).stream()
                    .map(f -> mapToResponse(f, false))
                    .collect(Collectors.toList());

            List<DocumentResponse> documents = documentRepository.findByFolderId(folder.getId()).stream()
                    .map(this::mapDocumentToResponse)
                    .collect(Collectors.toList());

            response.setSubfolders(subfolders);
            response.setDocuments(documents);
        }

        return response;
    }

    private DocumentResponse mapDocumentToResponse(Document doc) {
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
                .tags(doc.getTags().stream().map(t -> t.getTagName()).collect(Collectors.toSet()))
                .build();
    }
}
