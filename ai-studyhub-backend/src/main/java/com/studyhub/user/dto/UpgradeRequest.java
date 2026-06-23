package com.studyhub.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpgradeRequest {
    @NotNull(message = "Plan ID cannot be null")
    private Long planId;
}
