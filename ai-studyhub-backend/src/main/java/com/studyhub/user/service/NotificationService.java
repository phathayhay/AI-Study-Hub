package com.studyhub.user.service;

import com.studyhub.common.enums.NotificationType;
import com.studyhub.user.dto.NotificationResponse;
import com.studyhub.user.dto.NotificationSummaryResponse;
import com.studyhub.user.entity.Notification;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.NotificationRepository;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public NotificationSummaryResponse getNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<NotificationResponse> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());

        return NotificationSummaryResponse.builder()
                .unreadCount(unreadCount)
                .notifications(notifications)
                .build();
    }

    @Transactional
    public void markAsRead(Long notificationId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId());
        if (notification == null) {
            throw new IllegalArgumentException("Notification not found");
        }

        if (!Boolean.TRUE.equals(notification.getIsRead())) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    @Transactional
    public int markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void createNotification(User user, String title, String content, NotificationType notificationType) {
        createNotification(user, title, content, notificationType, null);
    }

    @Transactional
    public boolean createNotificationIfAbsent(User user, String title, String content, NotificationType notificationType) {
        if (user == null || notificationRepository.existsByUserIdAndTitleAndContentAndNotificationType(
                user.getId(), title, content, notificationType)) {
            return false;
        }

        createNotification(user, title, content, notificationType);
        return true;
    }

    @Transactional
    public void createNotification(User user, String title, String content, NotificationType notificationType, Long sourceCommentId) {
        if (user == null) {
            return;
        }

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .content(content)
                .notificationType(notificationType)
                .isRead(false)
                .sourceCommentId(sourceCommentId)
                .build();

        notificationRepository.save(notification);
        log.info("Created {} notification for user {}", notificationType, user.getEmail());
    }

    @Transactional
    public long deleteNotificationsBySourceCommentId(Long sourceCommentId) {
        if (sourceCommentId == null) {
            return 0;
        }

        long deletedCount = notificationRepository.deleteBySourceCommentId(sourceCommentId);
        if (deletedCount > 0) {
            log.info("Deleted {} notifications for source comment {}", deletedCount, sourceCommentId);
        }
        return deletedCount;
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .notificationType(notification.getNotificationType() != null ? notification.getNotificationType().name() : null)
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
