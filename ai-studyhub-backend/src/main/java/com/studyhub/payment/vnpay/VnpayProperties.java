package com.studyhub.payment.vnpay;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.payment.vnpay")
public class VnpayProperties {
    @Value("${app.payment.provider:CUSTOM_SANDBOX}")
    private String provider;
    private String version = "2.1.0";
    private String command = "pay";
    private String tmnCode;
    private String hashSecret;
    private String paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
    private String returnUrl;
    private String ipnUrl;
    private String frontendResultUrl = "http://localhost:5173/payment-result";
    private int expiryMinutes = 15;

    @PostConstruct
    void validateWhenEnabled() {
        if (!"VNPAY".equalsIgnoreCase(provider)) return;
        require(tmnCode, "VNPAY_TMN_CODE");
        require(hashSecret, "VNPAY_HASH_SECRET");
        require(paymentUrl, "VNPAY_PAYMENT_URL");
        require(returnUrl, "VNPAY_RETURN_URL");
    }

    public boolean isEnabled() {
        return "VNPAY".equalsIgnoreCase(provider);
    }

    private void require(String value, String environmentName) {
        if (value == null || value.isBlank() || value.startsWith("replace-with")) {
            throw new IllegalStateException(environmentName + " must be configured when PAYMENT_PROVIDER=VNPAY");
        }
    }
}
