package com.studyhub.admin.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDocumentResponse {
    private Long id;
    private String title;
    private String fileName;
    private Long fileSize;
    private String visibility;
    private String moderationStatus;
    private String ownerEmail;
    private BigDecimal averageRating;
    private LocalDateTime createdAt;
}
