package com.studyhub.user.entity;

import com.studyhub.common.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_plan_id")
    private SubscriptionPlan currentPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_plan_id", nullable = false)
    private SubscriptionPlan targetPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_plan_version_id")
    private SubscriptionPlanVersion currentPlanVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_plan_version_id", nullable = false)
    private SubscriptionPlanVersion targetPlanVersion;

    @Column(name = "payment_code", nullable = false, unique = true, length = 64)
    private String paymentCode;

    @Column(name = "transfer_content", nullable = false, unique = true, length = 128)
    private String transferContent;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "original_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal originalAmount;

    @Column(name = "remaining_value", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal remainingValue = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "bank_name", nullable = false, length = 100)
    private String bankName;

    @Column(name = "account_name", nullable = false, length = 255)
    private String accountName;

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "provider_name", length = 100)
    private String providerName;

    @Column(name = "payment_mode", length = 20)
    private String paymentMode;

    @Column(name = "vnp_txn_ref", length = 100, unique = true)
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 100, unique = true)
    private String vnpTransactionNo;

    @Column(name = "vnp_bank_tran_no", length = 100)
    private String vnpBankTranNo;

    @Column(name = "vnp_bank_code", length = 30)
    private String vnpBankCode;

    @Column(name = "vnp_card_type", length = 30)
    private String vnpCardType;

    @Column(name = "vnp_response_code", length = 10)
    private String vnpResponseCode;

    @Column(name = "vnp_transaction_status", length = 10)
    private String vnpTransactionStatus;

    @Column(name = "vnp_pay_date", length = 20)
    private String vnpPayDate;

    @Column(name = "provider_transaction_ref", length = 255, unique = true)
    private String providerTransactionRef;

    @Column(name = "failure_reason", length = 500)
    private String failureReason;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
