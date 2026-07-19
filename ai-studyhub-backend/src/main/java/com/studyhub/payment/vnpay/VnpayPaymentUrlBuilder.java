package com.studyhub.payment.vnpay;

import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class VnpayPaymentUrlBuilder {
    private final VnpayProperties properties;
    private final VnpaySignatureService signatureService;

    public VnpayPaymentUrlBuilder(VnpayProperties properties, VnpaySignatureService signatureService) {
        this.properties = properties;
        this.signatureService = signatureService;
    }

    public String build(Map<String, String> parameters) {
        Map<String, String> signedParameters = new LinkedHashMap<>(parameters);
        String payload = signatureService.signingPayload(signedParameters);
        String hash = signatureService.sign(signedParameters);
        return properties.getPaymentUrl() + "?" + payload + "&vnp_SecureHash=" + hash;
    }
}
