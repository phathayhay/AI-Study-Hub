package com.studyhub.payment.helper;

import lombok.extern.slf4j.Slf4j;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
public class VietQrHelper {

    /**
     * Build the VietQR img url using bank, account number, amount, content, and owner name.
     */
    public static String buildVietQrUrl(String bank, String account, BigDecimal amount, String content, String name) {
        try {
            String encodedContent = URLEncoder.encode(content, StandardCharsets.UTF_8.toString());
            String encodedName = URLEncoder.encode(name, StandardCharsets.UTF_8.toString());
            return String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s&accountName=%s",
                    mapBankCode(bank), account, amount.toPlainString(), encodedContent, encodedName
            );
        } catch (Exception e) {
            log.error("Failed to build VietQR URL: {}", e.getMessage());
            return String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%s&addInfo=%s",
                    mapBankCode(bank), account, amount.toPlainString(), content
            );
        }
    }

    private static String mapBankCode(String bankName) {
        if (bankName == null) {
            return "TPB";
        }

        String normalized = bankName.trim().toUpperCase();
        return switch (normalized) {
            case "TPBANK", "TPB" -> "TPB";
            case "MB", "MBBANK" -> "MB";
            default -> normalized;
        };
    }
}
