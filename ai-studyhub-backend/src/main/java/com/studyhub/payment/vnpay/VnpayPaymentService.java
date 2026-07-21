package com.studyhub.payment.vnpay;

import com.studyhub.common.enums.PaymentStatus;
import com.studyhub.payment.vnpay.dto.VnpayCheckoutResponse;
import com.studyhub.payment.vnpay.dto.VnpayIpnResponse;
import com.studyhub.user.entity.SubscriptionPayment;
import com.studyhub.user.repository.SubscriptionPaymentRepository;
import com.studyhub.user.service.SubscriptionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class VnpayPaymentService {
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VNPAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final VnpayProperties properties;
    private final VnpaySignatureService signatureService;
    private final VnpayPaymentUrlBuilder paymentUrlBuilder;
    private final SubscriptionService subscriptionService;
    private final SubscriptionPaymentRepository paymentRepository;

    public VnpayPaymentService(VnpayProperties properties, VnpaySignatureService signatureService,
                               VnpayPaymentUrlBuilder paymentUrlBuilder, SubscriptionService subscriptionService,
                               SubscriptionPaymentRepository paymentRepository) {
        this.properties = properties;
        this.signatureService = signatureService;
        this.paymentUrlBuilder = paymentUrlBuilder;
        this.subscriptionService = subscriptionService;
        this.paymentRepository = paymentRepository;
    }

    @Transactional
    public VnpayCheckoutResponse createCheckout(Long planId, String email, String clientIp) {
        requireEnabled();
        SubscriptionPayment payment = subscriptionService.createVnpayPendingPayment(planId, email);
        LocalDateTime created = LocalDateTime.now(VIETNAM_ZONE);
        LocalDateTime expires = created.plusMinutes(properties.getExpiryMinutes());
        String txnRef = created.format(VNPAY_DATE) + "-" + randomSuffix();

        payment.setVnpTxnRef(txnRef);
        payment.setExpiresAt(expires);
        payment.setPaymentMode("SANDBOX");
        payment.setProviderName("VNPAY");
        paymentRepository.save(payment);

        Map<String, String> parameters = new HashMap<>();
        parameters.put("vnp_Version", properties.getVersion());
        parameters.put("vnp_Command", properties.getCommand());
        parameters.put("vnp_TmnCode", properties.getTmnCode());
        parameters.put("vnp_Amount", toVnpayAmount(payment.getAmount()));
        parameters.put("vnp_CurrCode", "VND");
        parameters.put("vnp_TxnRef", txnRef);
        parameters.put("vnp_OrderInfo", "AI Study Hub " + payment.getTargetPlanVersion().getPlanName()
                + " - " + payment.getPaymentCode());
        parameters.put("vnp_OrderType", "other");
        parameters.put("vnp_Locale", "vn");
        parameters.put("vnp_ReturnUrl", properties.getReturnUrl());
        parameters.put("vnp_IpAddr", normalizeIp(clientIp));
        parameters.put("vnp_CreateDate", created.format(VNPAY_DATE));
        parameters.put("vnp_ExpireDate", expires.format(VNPAY_DATE));

        return new VnpayCheckoutResponse(
                payment.getPaymentCode(), txnRef, payment.getTargetPlanVersion().getPlanName(),
                payment.getAmount(), payment.getCurrency(), payment.getStatus().name(), expires,
                paymentUrlBuilder.build(parameters));
    }

    @Transactional(readOnly = true)
    public String validateReturnAndResolveOrderCode(Map<String, String> parameters) {
        if (!validSignature(parameters) || !properties.getTmnCode().equals(parameters.get("vnp_TmnCode"))) {
            return null;
        }
        SubscriptionPayment payment = paymentRepository.findByVnpTxnRef(parameters.get("vnp_TxnRef")).orElse(null);
        if (payment == null || !amountMatches(payment, parameters.get("vnp_Amount"))) return null;
        return payment.getPaymentCode();
    }

    @Transactional
    public VnpayIpnResponse processIpn(Map<String, String> parameters) {
        if (!validSignature(parameters)) return response("97", "Invalid Signature");
        if (!properties.getTmnCode().equals(parameters.get("vnp_TmnCode"))) {
            return response("97", "Invalid Signature");
        }

        String txnRef = parameters.get("vnp_TxnRef");
        SubscriptionPayment payment = paymentRepository.findWithLockByVnpTxnRef(txnRef).orElse(null);
        if (payment == null) return response("01", "Order not Found");
        if (!amountMatches(payment, parameters.get("vnp_Amount"))) return response("04", "Invalid Amount");
        if (payment.getStatus() != PaymentStatus.PENDING) return response("02", "Order already confirmed");

        String transactionNo = blankToNull(parameters.get("vnp_TransactionNo"));
        if (transactionNo != null && paymentRepository.findByVnpTransactionNo(transactionNo)
                .filter(existing -> !existing.getId().equals(payment.getId())).isPresent()) {
            return response("02", "Order already confirmed");
        }

        copyCallbackFields(payment, parameters);
        boolean successful = "00".equals(parameters.get("vnp_ResponseCode"))
                && "00".equals(parameters.get("vnp_TransactionStatus"));
        if (successful) {
            if (payment.getExpiresAt() != null && payment.getExpiresAt().isBefore(LocalDateTime.now(VIETNAM_ZONE))) {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setFailureReason("VNPAY callback received after checkout expiration");
                paymentRepository.save(payment);
                return response("02", "Order already confirmed");
            }
            subscriptionService.activateVerifiedProviderPayment(
                    payment, transactionNo != null ? transactionNo : txnRef, parsePayDate(parameters.get("vnp_PayDate")));
            return response("00", "Confirm Success");
        }

        payment.setStatus("24".equals(parameters.get("vnp_ResponseCode"))
                ? PaymentStatus.CANCELLED : PaymentStatus.FAILED);
        payment.setFailureReason("VNPAY response code " + parameters.getOrDefault("vnp_ResponseCode", "unknown"));
        paymentRepository.save(payment);
        return response("00", "Confirm Success");
    }

    public String frontendResultUrl(String orderCode) {
        String separator = properties.getFrontendResultUrl().contains("?") ? "&" : "?";
        return orderCode == null ? properties.getFrontendResultUrl()
                : properties.getFrontendResultUrl() + separator + "orderCode=" + signatureService.encode(orderCode);
    }

    @Transactional
    public void reconcileVerifiedQuery(String orderCode, Map<String, Object> queryResponse) {
        if (!"00".equals(value(queryResponse, "vnp_ResponseCode"))
                || !"00".equals(value(queryResponse, "vnp_TransactionStatus"))) return;

        SubscriptionPayment payment = paymentRepository.findWithLockByPaymentCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        if (payment.getStatus() == PaymentStatus.PAID) return;
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Payment is no longer eligible for reconciliation");
        }
        if (!payment.getVnpTxnRef().equals(value(queryResponse, "vnp_TxnRef"))
                || !amountMatches(payment, value(queryResponse, "vnp_Amount"))) {
            throw new IllegalArgumentException("VNPAY reconciliation data does not match the payment");
        }

        Map<String, String> callbackFields = new HashMap<>();
        queryResponse.forEach((key, value) -> callbackFields.put(key, value == null ? "" : value.toString()));
        copyCallbackFields(payment, callbackFields);
        String transactionNo = blankToNull(value(queryResponse, "vnp_TransactionNo"));
        subscriptionService.activateVerifiedProviderPayment(payment,
                transactionNo != null ? transactionNo : payment.getVnpTxnRef(),
                parsePayDate(value(queryResponse, "vnp_PayDate")));
    }

    static String toVnpayAmount(BigDecimal amount) {
        return amount.setScale(0, RoundingMode.UNNECESSARY).multiply(BigDecimal.valueOf(100)).toBigIntegerExact().toString();
    }

    private boolean validSignature(Map<String, String> parameters) {
        return signatureService.verify(parameters, parameters.get("vnp_SecureHash"));
    }

    private boolean amountMatches(SubscriptionPayment payment, String callbackAmount) {
        try {
            BigDecimal actualVnd = new BigDecimal(callbackAmount).divide(BigDecimal.valueOf(100), 0, RoundingMode.UNNECESSARY);
            return payment.getAmount().setScale(0, RoundingMode.UNNECESSARY).compareTo(actualVnd) == 0;
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private void copyCallbackFields(SubscriptionPayment payment, Map<String, String> parameters) {
        payment.setVnpTransactionNo(blankToNull(parameters.get("vnp_TransactionNo")));
        payment.setVnpBankTranNo(blankToNull(parameters.get("vnp_BankTranNo")));
        payment.setVnpBankCode(blankToNull(parameters.get("vnp_BankCode")));
        payment.setVnpCardType(blankToNull(parameters.get("vnp_CardType")));
        payment.setVnpResponseCode(blankToNull(parameters.get("vnp_ResponseCode")));
        payment.setVnpTransactionStatus(blankToNull(parameters.get("vnp_TransactionStatus")));
        payment.setVnpPayDate(blankToNull(parameters.get("vnp_PayDate")));
    }

    private LocalDateTime parsePayDate(String value) {
        try {
            return value == null ? LocalDateTime.now(VIETNAM_ZONE) : LocalDateTime.parse(value, VNPAY_DATE);
        } catch (RuntimeException exception) {
            return LocalDateTime.now(VIETNAM_ZONE);
        }
    }

    private String normalizeIp(String value) {
        if (value == null || value.isBlank() || value.contains(":")) return "127.0.0.1";
        return value.length() <= 45 ? value : value.substring(0, 45);
    }

    private String randomSuffix() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String value(Map<String, Object> values, String key) {
        Object value = values.get(key);
        return value == null ? "" : value.toString();
    }

    private void requireEnabled() {
        if (!properties.isEnabled()) throw new IllegalStateException("VNPAY payment provider is not enabled");
    }

    private VnpayIpnResponse response(String code, String message) {
        return new VnpayIpnResponse(code, message);
    }
}
