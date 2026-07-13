package com.studyhub.user.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscription_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plan_name", unique = true, nullable = false, length = 50)
    private String planName;

    @Column(length = 255)
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "storage_limit_mb", nullable = false)
    private Long storageLimitMb;

    @Column(name = "ai_requests_per_day", nullable = false)
    private Integer aiRequestsPerDay;

    @Column(name = "duration_days", nullable = false)
    @Builder.Default
    private Integer durationDays = 30;

    @Column(name = "can_use_ai_summary", nullable = false)
    @Builder.Default
    private Boolean canUseAiSummary = true;

    @Column(name = "can_use_flashcards", nullable = false)
    @Builder.Default
    private Boolean canUseFlashcards = true;

    @Column(name = "can_use_quizzes", nullable = false)
    @Builder.Default
    private Boolean canUseQuizzes = true;

    @Column(name = "can_publish_documents", nullable = false)
    @Builder.Default
    private Boolean canPublishDocuments = false;

    @Column(name = "can_publish_folders", nullable = false)
    @Builder.Default
    private Boolean canPublishFolders = false;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
