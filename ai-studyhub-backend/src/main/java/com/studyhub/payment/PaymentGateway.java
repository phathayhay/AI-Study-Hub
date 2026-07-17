package com.studyhub.payment;

import com.studyhub.user.entity.SubscriptionPayment;

public interface PaymentGateway {
    CheckoutSession createCheckout(SubscriptionPayment payment);
    boolean isSandbox();

    default void verifyCheckoutToken(String orderCode, String token) {
        throw new IllegalStateException("This payment gateway does not support local checkout completion");
    }

    record CheckoutSession(String checkoutUrl, String checkoutToken, String providerName) {}
}
