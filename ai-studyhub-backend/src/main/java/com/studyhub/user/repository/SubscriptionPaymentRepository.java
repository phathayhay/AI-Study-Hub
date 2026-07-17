package com.studyhub.user.repository;

import com.studyhub.common.enums.PaymentStatus;
import com.studyhub.user.entity.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, Long> {
    Optional<SubscriptionPayment> findByPaymentCode(String paymentCode);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select payment from SubscriptionPayment payment where payment.paymentCode = :paymentCode")
    Optional<SubscriptionPayment> findWithLockByPaymentCode(@Param("paymentCode") String paymentCode);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select payment from SubscriptionPayment payment where payment.transferContent = :transferContent")
    Optional<SubscriptionPayment> findWithLockByTransferContent(@Param("transferContent") String transferContent);
    Optional<SubscriptionPayment> findByTransferContent(String transferContent);
    Optional<SubscriptionPayment> findByIdempotencyKey(String idempotencyKey);
    Optional<SubscriptionPayment> findByProviderTransactionRef(String providerTransactionRef);
    Optional<SubscriptionPayment> findByVnpTxnRef(String vnpTxnRef);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select payment from SubscriptionPayment payment where payment.vnpTxnRef = :txnRef")
    Optional<SubscriptionPayment> findWithLockByVnpTxnRef(@Param("txnRef") String txnRef);
    Optional<SubscriptionPayment> findByVnpTransactionNo(String transactionNo);
    List<SubscriptionPayment> findByUser_IdOrderByCreatedAtDesc(Long userId);
    Optional<SubscriptionPayment> findFirstByUser_IdAndTargetPlan_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            Long targetPlanId,
            PaymentStatus status
    );
    List<SubscriptionPayment> findByStatusAndExpiresAtBefore(PaymentStatus status, java.time.LocalDateTime expiresAt);
}
