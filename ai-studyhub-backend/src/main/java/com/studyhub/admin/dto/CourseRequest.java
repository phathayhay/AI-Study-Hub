package com.studyhub.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

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

    private Long majorId;

    private List<Long> majorIds;

    @Builder.Default
    private Boolean isActive = true;
}
