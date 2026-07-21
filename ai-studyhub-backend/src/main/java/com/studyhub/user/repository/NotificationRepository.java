package com.studyhub.user.repository;

import com.studyhub.user.entity.Notification;
import com.studyhub.common.enums.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    Notification findByIdAndUserId(Long id, Long userId);

    long deleteBySourceCommentId(Long sourceCommentId);

    boolean existsByUserIdAndTitleAndContentAndNotificationType(
            Long userId,
            String title,
            String content,
            NotificationType notificationType
    );

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);
}
