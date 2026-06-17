package com.studyhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SimulatePaymentRequest {
    @NotNull(message = "Plan ID cannot be null")
    private Long planId;

    @NotBlank(message = "Transfer content cannot be blank")
    private String transferContent;
}
