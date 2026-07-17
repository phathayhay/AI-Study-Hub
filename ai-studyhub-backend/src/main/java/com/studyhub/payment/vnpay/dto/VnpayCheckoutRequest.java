package com.studyhub.payment.vnpay.dto;

import jakarta.validation.constraints.NotNull;

public record VnpayCheckoutRequest(@NotNull Long planId) {}
