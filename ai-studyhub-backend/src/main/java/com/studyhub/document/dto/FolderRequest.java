package com.studyhub.document.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderRequest {
    @NotBlank(message = "Folder name is required")
    private String folderName;
    private Long parentFolderId;
}
