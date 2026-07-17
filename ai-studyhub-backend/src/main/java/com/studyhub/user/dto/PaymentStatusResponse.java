package com.studyhub.user.dto;

import com.studyhub.common.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatusResponse {
    private String paymentCode;
    private Long planId;
    private String planName;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String transferContent;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime paidAt;
    private String transactionId;
    private boolean subscriptionActivated;
    private boolean finalStatus;
    private String message;
}
