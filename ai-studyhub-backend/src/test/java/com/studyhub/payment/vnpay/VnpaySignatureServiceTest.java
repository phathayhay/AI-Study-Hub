package com.studyhub.payment.vnpay;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VnpaySignatureServiceTest {
    private VnpaySignatureService signatureService;

    @BeforeEach
    void setUp() {
        VnpayProperties properties = new VnpayProperties();
        properties.setHashSecret("sandbox-secret-at-least-16-characters");
        signatureService = new VnpaySignatureService(properties);
    }

    @Test
    void sortsFiltersAndUtf8EncodesParameters() {
        Map<String, String> parameters = new LinkedHashMap<>();
        parameters.put("vnp_TxnRef", "ORDER+1");
        parameters.put("vnp_OrderInfo", "Nang cap goi tieng Viet");
        parameters.put("vnp_Amount", "2900000");
        parameters.put("vnp_Empty", "");
        parameters.put("vnp_SecureHash", "must-not-be-signed");

        assertEquals(
                "vnp_Amount=2900000&vnp_OrderInfo=Nang+cap+goi+tieng+Viet&vnp_TxnRef=ORDER%2B1",
                signatureService.signingPayload(parameters));
    }

    @Test
    void verifiesExactSignatureAndRejectsTampering() {
        Map<String, String> parameters = new LinkedHashMap<>();
        parameters.put("vnp_Amount", "2900000");
        parameters.put("vnp_TxnRef", "TXN-100");
        String hash = signatureService.sign(parameters);

        assertTrue(signatureService.verify(parameters, hash));
        parameters.put("vnp_Amount", "6900000");
        assertFalse(signatureService.verify(parameters, hash));
    }

    @Test
    void encodesVietnameseTextAsUtf8() {
        assertEquals("N%C3%A2ng+c%E1%BA%A5p+g%C3%B3i",
                signatureService.encode("N\u00e2ng c\u1ea5p g\u00f3i"));
    }
}
