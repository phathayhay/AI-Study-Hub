package com.studyhub.user.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingHistoryResponse {
    private String planName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private BigDecimal amount;
    private LocalDateTime paidAt;
    private String paymentStatus;
    private String transactionRef;
}
