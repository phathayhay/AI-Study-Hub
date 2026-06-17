package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseRequest {
    @NotBlank(message = "Course code cannot be blank")
    private String courseCode;

    @NotBlank(message = "Course name cannot be blank")
    private String courseName;

    private String description;

    @NotNull(message = "Major ID cannot be null")
    private Long majorId;

    @Builder.Default
    private Boolean isActive = true;
}
