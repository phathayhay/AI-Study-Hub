package com.studyhub.payment.vnpay.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record VnpayCheckoutResponse(
        String orderCode,
        String txnRef,
        String planName,
        BigDecimal amount,
        String currency,
        String status,
        LocalDateTime expiresAt,
        String paymentUrl
) {}
