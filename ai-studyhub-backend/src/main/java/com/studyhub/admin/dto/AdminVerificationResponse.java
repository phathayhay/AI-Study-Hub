package com.studyhub.admin.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminVerificationResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userFullName;
    private String studentCode;
    private String imageUrl;
    private String status;
    private String reviewNote;
    private String reviewedByEmail;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}
