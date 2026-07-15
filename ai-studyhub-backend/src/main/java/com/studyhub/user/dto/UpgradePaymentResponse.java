package com.studyhub.user.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpgradePaymentResponse {
    private Long planId;
    private String planName;
    private String currentPlanName;
    private BigDecimal amount;
    private BigDecimal currentPlanPrice;
    private BigDecimal targetPlanPrice;
    private BigDecimal creditApplied;
    private Long remainingDays;
    private Long billingCycleDays;
    private LocalDateTime currentPeriodEndDate;
    private Integer durationDays;
    private String accountName;
    private String bankName;
    private String accountNumber;
    private String paymentCode;
    private String transferContent;
    private String qrCodeUrl;
    private String paymentStatus;
    private LocalDateTime expiresAt;
}
