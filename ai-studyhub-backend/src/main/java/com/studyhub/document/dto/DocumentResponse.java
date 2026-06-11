package com.studyhub.document.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentResponse {
    private Long id;
    private Long userId;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private String thumbnailUrl;
    private Long fileSize;
    private String fileType;
    private String visibility;
    private String moderationStatus;
    private BigDecimal averageRating;
    private Integer totalViews;
    private Integer totalDownloads;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long folderId;
    private Long courseId;
    private Long categoryId;
    private Set<String> tags;
}
