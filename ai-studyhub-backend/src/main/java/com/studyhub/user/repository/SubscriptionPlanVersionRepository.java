package com.studyhub.user.repository;

import com.studyhub.user.entity.SubscriptionPlanVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionPlanVersionRepository extends JpaRepository<SubscriptionPlanVersion, Long> {
    Optional<SubscriptionPlanVersion> findFirstByPlan_IdOrderByVersionNumberDesc(Long planId);
    List<SubscriptionPlanVersion> findByPlan_IdOrderByVersionNumberDesc(Long planId);
    boolean existsByPlan_Id(Long planId);
}
