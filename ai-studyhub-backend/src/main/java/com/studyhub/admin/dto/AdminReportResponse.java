package com.studyhub.admin.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReportResponse {
    private Long id;
    private String reporterEmail;
    private Long documentId;
    private String documentTitle;
    private String reportType;
    private String status;
    private String reportReason;
    private LocalDateTime createdAt;
}
