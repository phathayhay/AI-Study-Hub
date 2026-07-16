package com.studyhub.user.repository;

import com.studyhub.user.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
    long countByUser_IdAndActionTypeStartingWithAndCreatedAtBetween(
            Long userId,
            String actionTypePrefix,
            LocalDateTime start,
            LocalDateTime end
    );
}
