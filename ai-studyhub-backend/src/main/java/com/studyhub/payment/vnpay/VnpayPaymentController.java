package com.studyhub.payment.vnpay;

import com.studyhub.common.ApiResponse;
import com.studyhub.payment.vnpay.dto.VnpayCheckoutRequest;
import com.studyhub.payment.vnpay.dto.VnpayCheckoutResponse;
import com.studyhub.payment.vnpay.dto.VnpayIpnResponse;
import com.studyhub.security.SecurityUtils;
import com.studyhub.user.dto.PaymentStatusResponse;
import com.studyhub.user.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class VnpayPaymentController {
    private final VnpayPaymentService vnpayPaymentService;
    private final SubscriptionService subscriptionService;

    @PostMapping("/api/payments/vnpay/checkout")
    public ResponseEntity<ApiResponse<VnpayCheckoutResponse>> checkout(
            @Valid @RequestBody VnpayCheckoutRequest request, HttpServletRequest servletRequest) {
        VnpayCheckoutResponse response = vnpayPaymentService.createCheckout(
                request.planId(), SecurityUtils.getCurrentUserEmail(), servletRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("VNPAY checkout created", response));
    }

    @GetMapping("/api/payments/vnpay/return")
    public ResponseEntity<Void> paymentReturn(@RequestParam Map<String, String> parameters) {
        String orderCode = vnpayPaymentService.validateReturnAndResolveOrderCode(parameters);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, vnpayPaymentService.frontendResultUrl(orderCode))
                .build();
    }

    @GetMapping("/api/payments/vnpay/ipn")
    public VnpayIpnResponse ipn(@RequestParam Map<String, String> parameters) {
        try {
            return vnpayPaymentService.processIpn(new LinkedHashMap<>(parameters));
        } catch (Exception exception) {
            return new VnpayIpnResponse("99", "Unknown error");
        }
    }

    @GetMapping("/api/payments/{orderCode}/status")
    public ResponseEntity<ApiResponse<PaymentStatusResponse>> status(@PathVariable String orderCode) {
        return ResponseEntity.ok(ApiResponse.ok("Payment status retrieved successfully",
                subscriptionService.getPaymentStatus(orderCode, SecurityUtils.getCurrentUserEmail())));
    }
}
