package com.studyhub.payment.vnpay;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class VnpaySignatureService {
    private final VnpayProperties properties;

    public VnpaySignatureService(VnpayProperties properties) {
        this.properties = properties;
    }

    public String signingPayload(Map<String, String> parameters) {
        return new TreeMap<>(parameters).entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isBlank())
                .filter(entry -> !"vnp_SecureHash".equals(entry.getKey()))
                .filter(entry -> !"vnp_SecureHashType".equals(entry.getKey()))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    public String sign(Map<String, String> parameters) {
        return hmacSha512(properties.getHashSecret(), signingPayload(parameters));
    }

    public String signRaw(String payload) {
        return hmacSha512(properties.getHashSecret(), payload);
    }

    public boolean verifyRaw(String payload, String suppliedHash) {
        if (suppliedHash == null || suppliedHash.isBlank()) return false;
        return MessageDigest.isEqual(
                signRaw(payload).getBytes(StandardCharsets.US_ASCII),
                suppliedHash.toLowerCase().getBytes(StandardCharsets.US_ASCII));
    }

    public boolean verify(Map<String, String> parameters, String suppliedHash) {
        if (suppliedHash == null || suppliedHash.isBlank()) return false;
        byte[] expected = sign(parameters).getBytes(StandardCharsets.US_ASCII);
        byte[] supplied = suppliedHash.toLowerCase().getBytes(StandardCharsets.US_ASCII);
        return MessageDigest.isEqual(expected, supplied);
    }

    public String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String hmacSha512(String secret, String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder(bytes.length * 2);
            for (byte value : bytes) result.append(String.format("%02x", value));
            return result.toString();
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to sign VNPAY request", exception);
        }
    }
}
