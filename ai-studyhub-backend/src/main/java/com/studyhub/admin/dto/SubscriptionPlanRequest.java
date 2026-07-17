package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanRequest {
    @NotBlank(message = "Plan name cannot be blank")
    private String planName;

    private String description;

    @NotNull(message = "Price cannot be null")
    private BigDecimal price;

    @NotNull(message = "Storage limit cannot be null")
    private Long storageLimitMb;

    @NotNull(message = "AI requests limit cannot be null")
    private Integer aiRequestsPerDay;

    @Builder.Default
    private Integer downloadLimit = 0;

    @Builder.Default
    private Integer bookmarkLimit = 0;

    @NotNull(message = "Plan duration cannot be null")
    @Builder.Default
    private Integer durationDays = 30;

    @Builder.Default
    private Boolean canUseAiSummary = true;

    @Builder.Default
    private Boolean canUseFlashcards = true;

    @Builder.Default
    private Boolean canUseQuizzes = true;

    @Builder.Default
    private Boolean canPublishDocuments = false;

    @Builder.Default
    private Boolean canPublishFolders = false;

    @Builder.Default
    private Boolean isActive = true;
}
