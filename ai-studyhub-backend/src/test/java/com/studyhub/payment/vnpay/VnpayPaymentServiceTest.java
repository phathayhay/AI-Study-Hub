package com.studyhub.payment.vnpay;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import com.studyhub.common.enums.PaymentStatus;
import com.studyhub.user.entity.SubscriptionPayment;
import com.studyhub.user.repository.SubscriptionPaymentRepository;
import com.studyhub.user.service.SubscriptionService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class VnpayPaymentServiceTest {
    private VnpayProperties properties;
    private VnpaySignatureService signatureService;
    private SubscriptionService subscriptionService;
    private SubscriptionPaymentRepository paymentRepository;
    private VnpayPaymentService paymentService;

    @BeforeEach
    void setUp() {
        properties = new VnpayProperties();
        properties.setTmnCode("STUDYHUB");
        properties.setHashSecret("sandbox-secret-at-least-16-characters");
        signatureService = new VnpaySignatureService(properties);
        subscriptionService = mock(SubscriptionService.class);
        paymentRepository = mock(SubscriptionPaymentRepository.class);
        paymentService = new VnpayPaymentService(properties, signatureService,
                new VnpayPaymentUrlBuilder(properties, signatureService), subscriptionService, paymentRepository);
    }

    @Test
    void multipliesDatabaseVndAmountByOneHundred() {
        assertEquals("2900000", VnpayPaymentService.toVnpayAmount(new BigDecimal("29000")));
        assertEquals("6900000", VnpayPaymentService.toVnpayAmount(new BigDecimal("69000")));
    }

    @Test
    void rejectsFractionalVndAmounts() {
        assertThrows(ArithmeticException.class,
                () -> VnpayPaymentService.toVnpayAmount(new BigDecimal("29000.50")));
    }

    @Test
    void validSuccessfulIpnActivatesExactlyOnce() {
        SubscriptionPayment payment = pendingPayment();
        when(paymentRepository.findWithLockByVnpTxnRef("TXN-100")).thenReturn(Optional.of(payment));
        Map<String, String> callback = signedCallback("2900000", "00", "00");

        assertEquals("00", paymentService.processIpn(callback).responseCode());
        verify(subscriptionService).activateVerifiedProviderPayment(eq(payment), eq("VNP-900"), any());
    }

    @Test
    void invalidSignatureIsRejectedWithoutDatabaseAccess() {
        Map<String, String> callback = signedCallback("2900000", "00", "00");
        callback.put("vnp_SecureHash", "invalid");

        assertEquals("97", paymentService.processIpn(callback).responseCode());
        verifyNoInteractions(paymentRepository, subscriptionService);
    }

    @Test
    void amountMismatchDoesNotActivateSubscription() {
        SubscriptionPayment payment = pendingPayment();
        when(paymentRepository.findWithLockByVnpTxnRef("TXN-100")).thenReturn(Optional.of(payment));

        assertEquals("04", paymentService.processIpn(signedCallback("6900000", "00", "00")).responseCode());
        verifyNoInteractions(subscriptionService);
    }

    @Test
    void repeatedPaidIpnIsIdempotent() {
        SubscriptionPayment payment = pendingPayment();
        payment.setStatus(PaymentStatus.PAID);
        when(paymentRepository.findWithLockByVnpTxnRef("TXN-100")).thenReturn(Optional.of(payment));

        assertEquals("02", paymentService.processIpn(signedCallback("2900000", "00", "00")).responseCode());
        verifyNoInteractions(subscriptionService);
    }

    private SubscriptionPayment pendingPayment() {
        return SubscriptionPayment.builder()
                .id(10L)
                .amount(new BigDecimal("29000"))
                .status(PaymentStatus.PENDING)
                .vnpTxnRef("TXN-100")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
    }

    private Map<String, String> signedCallback(String amount, String responseCode, String transactionStatus) {
        Map<String, String> callback = new HashMap<>();
        callback.put("vnp_TmnCode", "STUDYHUB");
        callback.put("vnp_TxnRef", "TXN-100");
        callback.put("vnp_Amount", amount);
        callback.put("vnp_ResponseCode", responseCode);
        callback.put("vnp_TransactionStatus", transactionStatus);
        callback.put("vnp_TransactionNo", "VNP-900");
        callback.put("vnp_PayDate", "20260717203000");
        callback.put("vnp_SecureHash", signatureService.sign(callback));
        return callback;
    }
}
