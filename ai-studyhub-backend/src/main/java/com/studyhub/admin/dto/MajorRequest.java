package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MajorRequest {
    @NotBlank(message = "Major code cannot be blank")
    private String majorCode;

    @NotBlank(message = "Major name cannot be blank")
    private String majorName;

    private String description;
}
