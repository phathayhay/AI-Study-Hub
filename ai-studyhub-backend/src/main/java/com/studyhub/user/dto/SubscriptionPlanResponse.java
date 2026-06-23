package com.studyhub.user.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlanResponse {
    private Long id;
    private String planName;
    private String description;
    private BigDecimal price;
    private Long storageLimitMb;
    private Integer aiRequestsPerDay;
}
