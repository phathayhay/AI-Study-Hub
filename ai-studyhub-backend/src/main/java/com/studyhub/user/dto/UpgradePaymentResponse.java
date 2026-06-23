package com.studyhub.user.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpgradePaymentResponse {
    private Long planId;
    private String planName;
    private BigDecimal amount;
    private String accountName;
    private String bankName;
    private String accountNumber;
    private String transferContent;
    private String qrCodeUrl;
}
