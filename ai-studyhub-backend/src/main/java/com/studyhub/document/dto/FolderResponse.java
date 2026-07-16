package com.studyhub.document.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderResponse {
    private Long id;
    private Long userId;
    private String ownerName;
    private String folderName;
    private Long parentFolderId;
    private String visibility;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer publicDocumentCount;
    private Integer totalDownloads;
    private Set<Long> courseIds;
    private Set<Long> categoryIds;
    private Set<String> semesters;
    private Boolean publishReady;
    private String publishBlockedReason;
    private List<FolderResponse> subfolders;
    private List<DocumentResponse> documents;
}
