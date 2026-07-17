package com.studyhub.payment.vnpay;

import com.studyhub.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/payments/vnpay")
@RequiredArgsConstructor
public class VnpayAdminPaymentController {
    private final VnpayReconciliationService reconciliationService;

    @PostMapping("/{orderCode}/query")
    public ResponseEntity<ApiResponse<Map<String, Object>>> query(
            @PathVariable String orderCode, HttpServletRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("VNPAY transaction queried successfully",
                reconciliationService.query(orderCode, request.getRemoteAddr())));
    }
}
