package com.studyhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentWebhookRequest {

    @NotBlank(message = "Transfer content cannot be blank")
    private String transferContent;

    @NotNull(message = "Amount cannot be null")
    private BigDecimal amount;

    private String transactionReference;
    private String providerName;
    private String bankName;
    private String accountNumber;
    private LocalDateTime transactionTime;
}
