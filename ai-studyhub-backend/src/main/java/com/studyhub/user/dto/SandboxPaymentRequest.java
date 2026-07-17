package com.studyhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SandboxPaymentRequest {
    @NotBlank
    private String token;

    @NotBlank
    @Pattern(regexp = "SUCCESS|FAILED|CANCELLED|EXPIRED", message = "Unsupported sandbox outcome")
    private String outcome;
}
