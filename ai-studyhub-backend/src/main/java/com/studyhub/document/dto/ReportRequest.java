package com.studyhub.document.dto;

import com.studyhub.common.enums.ReportType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReportRequest {

    @NotNull(message = "Loại báo cáo không được để trống")
    private ReportType reportType;

    @NotBlank(message = "Lý do báo cáo không được để trống")
    private String reportReason;
}
