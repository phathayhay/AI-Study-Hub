package com.studyhub.payment;

import com.studyhub.user.entity.SubscriptionPayment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SandboxPaymentGateway implements PaymentGateway {

    @Value("${app.payment.mode:SANDBOX}")
    private String paymentMode;

    @Value("${app.payment.sandbox-signing-secret:}")
    private String signingSecret;

    @Value("${app.payment.sandbox-public-frontend-url:${app.frontend-url:http://localhost:5173}}")
    private String publicFrontendUrl;

    @Override
    public CheckoutSession createCheckout(SubscriptionPayment payment) {
        ensureSandbox();
        long expiresAt = payment.getExpiresAt().atZone(java.time.ZoneId.systemDefault()).toEpochSecond();
        String payload = payment.getPaymentCode() + "|" + expiresAt + "|" + UUID.randomUUID();
        String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String token = encodedPayload + "." + sign(encodedPayload);
        String baseUrl = publicFrontendUrl.replaceAll("/+$", "");
        String checkoutUrl = baseUrl + "/sandbox-payment/" + payment.getPaymentCode() + "?token=" + token;
        return new CheckoutSession(checkoutUrl, token, "STUDYHUB_SANDBOX");
    }

    @Override
    public void verifyCheckoutToken(String orderCode, String token) {
        ensureSandbox();
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invalid sandbox checkout signature");
        }
        String[] parts = token.split("\\.", 2);
        if (parts.length != 2 || !MessageDigest.isEqual(
                sign(parts[0]).getBytes(StandardCharsets.UTF_8),
                parts[1].getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid sandbox checkout signature");
        }
        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            String[] claims = payload.split("\\|", 3);
            if (claims.length != 3 || !MessageDigest.isEqual(
                    orderCode.getBytes(StandardCharsets.UTF_8),
                    claims[0].getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException("Sandbox token does not match this order");
            }
            if (Instant.now().getEpochSecond() > Long.parseLong(claims[1])) {
                throw new IllegalArgumentException("Sandbox checkout token has expired");
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid sandbox checkout token");
        }
    }

    @Override
    public boolean isSandbox() {
        return "SANDBOX".equalsIgnoreCase(paymentMode);
    }

    private void ensureSandbox() {
        if (!isSandbox()) throw new IllegalStateException("Sandbox payment endpoints are disabled");
        if (signingSecret == null || signingSecret.length() < 16) {
            throw new IllegalStateException("PAYMENT_SANDBOX_SIGNING_SECRET must contain at least 16 characters");
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign sandbox checkout", ex);
        }
    }
}
