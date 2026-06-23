package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentModerationRequest {
    @NotBlank(message = "Moderation status cannot be blank (APPROVED or REJECTED)")
    private String status;
}
