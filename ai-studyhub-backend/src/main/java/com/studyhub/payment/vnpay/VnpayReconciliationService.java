package com.studyhub.payment.vnpay;

import com.studyhub.user.entity.SubscriptionPayment;
import com.studyhub.user.repository.SubscriptionPaymentRepository;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class VnpayReconciliationService {
    private static final DateTimeFormatter VNPAY_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final VnpayProperties properties;
    private final VnpaySignatureService signatureService;
    private final SubscriptionPaymentRepository paymentRepository;
    private final VnpayPaymentService paymentService;
    private final RestClient restClient = RestClient.create();

    public VnpayReconciliationService(VnpayProperties properties, VnpaySignatureService signatureService,
                                      SubscriptionPaymentRepository paymentRepository,
                                      VnpayPaymentService paymentService) {
        this.properties = properties;
        this.signatureService = signatureService;
        this.paymentRepository = paymentRepository;
        this.paymentService = paymentService;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> query(String orderCode, String clientIp) {
        if (!properties.isEnabled()) throw new IllegalStateException("VNPAY payment provider is not enabled");
        SubscriptionPayment payment = paymentRepository.findByPaymentCode(orderCode)
                .orElseThrow(() -> new IllegalArgumentException("Payment request not found"));
        if (payment.getVnpTxnRef() == null) throw new IllegalArgumentException("This is not a VNPAY payment");

        String requestId = UUID.randomUUID().toString().replace("-", "");
        String createDate = LocalDateTime.now(VIETNAM_ZONE).format(VNPAY_DATE);
        String transactionDate = payment.getCreatedAt().format(VNPAY_DATE);
        String orderInfo = "Query AI Study Hub order " + orderCode;
        String ip = clientIp == null || clientIp.isBlank() ? "127.0.0.1" : clientIp;
        String checksumData = String.join("|", requestId, properties.getVersion(), "querydr",
                properties.getTmnCode(), payment.getVnpTxnRef(), transactionDate, createDate, ip, orderInfo);

        Map<String, Object> request = new LinkedHashMap<>();
        request.put("vnp_RequestId", requestId);
        request.put("vnp_Version", properties.getVersion());
        request.put("vnp_Command", "querydr");
        request.put("vnp_TmnCode", properties.getTmnCode());
        request.put("vnp_TxnRef", payment.getVnpTxnRef());
        request.put("vnp_OrderInfo", orderInfo);
        request.put("vnp_TransactionDate", transactionDate);
        request.put("vnp_CreateDate", createDate);
        request.put("vnp_IpAddr", ip);
        request.put("vnp_SecureHash", signatureService.signRaw(checksumData));

        Map<String, Object> response = restClient.post().uri(properties.getApiUrl())
                .contentType(MediaType.APPLICATION_JSON).body(request).retrieve().body(Map.class);
        if (response == null || !validResponseSignature(response)) {
            throw new IllegalStateException("VNPAY QueryDR returned an invalid signature");
        }
        paymentService.reconcileVerifiedQuery(orderCode, response);
        response.remove("vnp_SecureHash");
        return response;
    }

    private boolean validResponseSignature(Map<String, Object> response) {
        String checksumData = String.join("|",
                value(response, "vnp_ResponseId"), value(response, "vnp_Command"),
                value(response, "vnp_ResponseCode"), value(response, "vnp_Message"),
                value(response, "vnp_TmnCode"), value(response, "vnp_TxnRef"),
                value(response, "vnp_Amount"), value(response, "vnp_BankCode"),
                value(response, "vnp_PayDate"), value(response, "vnp_TransactionNo"),
                value(response, "vnp_TransactionType"), value(response, "vnp_TransactionStatus"),
                value(response, "vnp_OrderInfo"), value(response, "vnp_PromotionCode"),
                value(response, "vnp_PromotionAmount"));
        return signatureService.verifyRaw(checksumData, value(response, "vnp_SecureHash"));
    }

    private String value(Map<String, Object> values, String key) {
        Object value = values.get(key);
        return value == null ? "" : value.toString();
    }
}
