package com.studyhub.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class CurrentSubscriptionResponse {
    private Long subscriptionId;
    private String planName;
    private Long planId;
    private Long planVersionId;
    private Integer planVersionNumber;
    private BigDecimal price;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean autoRenew;
    private Long storageLimitMb;
    private Integer aiRequestsPerDay;
    private Integer downloadLimit;
    private Integer bookmarkLimit;
    private Boolean canUseAiSummary;
    private Boolean canUseFlashcards;
    private Boolean canUseQuizzes;
    private Boolean canPublishDocuments;
    private Boolean canPublishFolders;
    private SubscriptionPlanVersionResponse upcomingVersion;
}
