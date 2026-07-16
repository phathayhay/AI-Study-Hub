package com.studyhub.document.dto;

import com.studyhub.common.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
    @NotBlank(message = "Semester is required")
    @Pattern(regexp = "Semester [1-9]", message = "Semester must be between Semester 1 and Semester 9")
    private String semester;
    @NotNull(message = "Course is required")
    private Long courseId;
    @NotNull(message = "Document type is required")
    private Long categoryId;
    private Long folderId;
    private Visibility visibility;
    private Set<String> tags;
}
