package com.studyhub.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class SubscriptionPlanVersionResponse {
    private Long id;
    private Long planId;
    private Integer versionNumber;
    private String planName;
    private String description;
    private BigDecimal price;
    private Long storageLimitMb;
    private Integer aiRequestsPerDay;
    private Integer downloadLimit;
    private Integer bookmarkLimit;
    private Integer durationDays;
    private Boolean canUseAiSummary;
    private Boolean canUseFlashcards;
    private Boolean canUseQuizzes;
    private Boolean canPublishDocuments;
    private Boolean canPublishFolders;
    private LocalDateTime effectiveFrom;
    private LocalDateTime createdAt;
}
