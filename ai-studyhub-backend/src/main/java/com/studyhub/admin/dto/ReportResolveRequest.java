package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResolveRequest {
    @NotBlank(message = "Resolve status cannot be blank (RESOLVED or REJECTED)")
    private String status;

    @Builder.Default
    private boolean deleteDocument = false;
}
