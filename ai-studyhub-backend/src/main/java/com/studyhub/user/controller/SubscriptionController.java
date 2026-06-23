package com.studyhub.user.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.security.SecurityUtils;
import com.studyhub.user.dto.*;
import com.studyhub.user.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscription & Payment", description = "Endpoints for managing subscription plans, upgrade simulation, and billing logs")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    @Operation(summary = "Get active subscription plans", description = "Retrieves a list of all active subscription plans (FREE, PRO, PREMIUM) with pricing, storage, and AI request limits.")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> getActivePlans() {
        log.info("API: Fetching active subscription plans");
        List<SubscriptionPlanResponse> response = subscriptionService.getActivePlans();
        return ResponseEntity.ok(ApiResponse.ok("Plans retrieved successfully", response));
    }

    @PostMapping("/upgrade")
    @Operation(summary = "Get plan upgrade payment info", description = "Requests checkout information for upgrading a plan. Returns dynamic VietQR transfer bank details and dynamic code image URL.")
    public ResponseEntity<ApiResponse<UpgradePaymentResponse>> getUpgradePaymentInfo(
            @Valid @RequestBody UpgradeRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Requesting payment details for plan ID {} by user {}", request.getPlanId(), email);
        UpgradePaymentResponse response = subscriptionService.getUpgradePaymentInfo(request.getPlanId(), email);
        return ResponseEntity.ok(ApiResponse.ok("Checkout details generated successfully", response));
    }

    @PostMapping("/simulate-payment")
    @Operation(summary = "Simulate payment webhook/callback success", description = "Simulates successful transfer receipt to instantly upgrade user's active plan.")
    public ResponseEntity<ApiResponse<String>> simulatePaymentSuccess(
            @Valid @RequestBody SimulatePaymentRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Simulating payment success callback for plan ID {} by user {}", request.getPlanId(), email);
        subscriptionService.simulatePaymentSuccess(request, email);
        return ResponseEntity.ok(ApiResponse.ok("Subscription plan upgraded successfully"));
    }

    @GetMapping("/history")
    @Operation(summary = "Get billing history", description = "Retrieves all subscription billing and plan usage logs for the currently logged-in user.")
    public ResponseEntity<ApiResponse<List<BillingHistoryResponse>>> getBillingHistory() {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Retrieving billing history for user {}", email);
        List<BillingHistoryResponse> response = subscriptionService.getBillingHistory(email);
        return ResponseEntity.ok(ApiResponse.ok("Billing history retrieved successfully", response));
    }
}
