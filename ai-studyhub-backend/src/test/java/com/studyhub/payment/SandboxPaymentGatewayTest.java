package com.studyhub.payment;

import com.studyhub.user.entity.SubscriptionPayment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class SandboxPaymentGatewayTest {

    private SandboxPaymentGateway gateway;

    @BeforeEach
    void setUp() {
        gateway = new SandboxPaymentGateway();
        ReflectionTestUtils.setField(gateway, "paymentMode", "SANDBOX");
        ReflectionTestUtils.setField(gateway, "signingSecret", "test-secret-at-least-16-characters");
        ReflectionTestUtils.setField(gateway, "publicFrontendUrl", "http://localhost:5173");
    }

    @Test
    void signedCheckoutToken_IsAccepted() {
        SubscriptionPayment payment = SubscriptionPayment.builder()
                .paymentCode("ORDER-100")
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .build();
        PaymentGateway.CheckoutSession checkout = gateway.createCheckout(payment);

        assertDoesNotThrow(() -> gateway.verifyCheckoutToken("ORDER-100", checkout.checkoutToken()));
        assertTrue(checkout.checkoutUrl().startsWith("http://localhost:5173/sandbox-payment"));
    }

    @Test
    void modifiedCheckoutToken_IsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> gateway.verifyCheckoutToken("ORDER-100", "modified-token"));
    }

    @Test
    void sandboxOperations_AreBlockedInProductionMode() {
        ReflectionTestUtils.setField(gateway, "paymentMode", "PRODUCTION");
        assertThrows(IllegalStateException.class,
                () -> gateway.createCheckout(SubscriptionPayment.builder().paymentCode("ORDER-100").build()));
    }
}
