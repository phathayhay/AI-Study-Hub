package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationReviewRequest {
    @NotBlank(message = "Review status cannot be blank (APPROVED or REJECTED)")
    private String status;

    private String reviewNote;
}
