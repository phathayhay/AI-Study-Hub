package com.studyhub.user.repository;

import com.studyhub.user.entity.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, Long> {
    List<UserSubscription> findByUser_EmailOrderByCreatedAtDesc(String email);
    List<UserSubscription> findByUser_IdAndIsActiveTrue(Long userId);
    List<UserSubscription> findByIsActiveTrueAndEndDateBefore(LocalDateTime endDate);
}
