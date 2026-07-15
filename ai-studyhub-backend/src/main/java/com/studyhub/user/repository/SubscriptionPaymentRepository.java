package com.studyhub.user.repository;

import com.studyhub.common.enums.PaymentStatus;
import com.studyhub.user.entity.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, Long> {
    Optional<SubscriptionPayment> findByPaymentCode(String paymentCode);
    Optional<SubscriptionPayment> findByTransferContent(String transferContent);
    Optional<SubscriptionPayment> findFirstByUser_IdAndTargetPlan_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            Long targetPlanId,
            PaymentStatus status
    );
}
