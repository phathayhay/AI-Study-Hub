package com.studyhub.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "subscription_plan_versions",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_plan_version",
                columnNames = {"subscription_plan_id", "version_number"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subscription_plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "plan_name", nullable = false, length = 50)
    private String planName;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "storage_limit_mb", nullable = false)
    private Long storageLimitMb;

    @Column(name = "ai_requests_per_day", nullable = false)
    private Integer aiRequestsPerDay;

    @Column(name = "download_limit", nullable = false)
    @Builder.Default
    private Integer downloadLimit = 0;

    @Column(name = "bookmark_limit", nullable = false)
    @Builder.Default
    private Integer bookmarkLimit = 0;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "can_use_ai_summary", nullable = false)
    private Boolean canUseAiSummary;

    @Column(name = "can_use_flashcards", nullable = false)
    private Boolean canUseFlashcards;

    @Column(name = "can_use_quizzes", nullable = false)
    private Boolean canUseQuizzes;

    @Column(name = "can_publish_documents", nullable = false)
    private Boolean canPublishDocuments;

    @Column(name = "can_publish_folders", nullable = false)
    private Boolean canPublishFolders;

    @Column(name = "effective_from", nullable = false)
    private LocalDateTime effectiveFrom;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (effectiveFrom == null) effectiveFrom = now;
        if (createdAt == null) createdAt = now;
    }
}
