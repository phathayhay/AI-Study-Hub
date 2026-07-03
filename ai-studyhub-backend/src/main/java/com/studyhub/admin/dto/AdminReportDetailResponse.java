package com.studyhub.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportDetailResponse {
    private Long id;
    private String reporterEmail;
    private String reporterFullName;
    private String documentOwnerEmail;
    private Long documentId;
    private String documentTitle;
    private String documentFileName;
    private String documentVisibility;
    private String documentModerationStatus;
    private String courseCode;
    private String courseName;
    private Integer documentReportCount;
    private String reportType;
    private String status;
    private String reportReason;
    private LocalDateTime createdAt;
    private LocalDateTime documentCreatedAt;
}
