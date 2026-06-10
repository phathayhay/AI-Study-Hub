package com.studyhub.document.dto;

import com.studyhub.common.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUploadRequest {
    @NotBlank(message = "Title is required")
    private String title;
    private String description;
    private Long courseId;
    private Long categoryId;
    private Long folderId;
    private Visibility visibility;
    private Set<String> tags;
}
