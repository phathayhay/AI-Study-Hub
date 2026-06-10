package com.studyhub.document.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderResponse {
    private Long id;
    private Long userId;
    private String folderName;
    private Long parentFolderId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<FolderResponse> subfolders;
    private List<DocumentResponse> documents;
}
