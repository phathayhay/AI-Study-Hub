package com.studyhub.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseListResponse {
    private Long id;
    private String courseCode;
    private String courseName;
    private String description;
    private Boolean isActive;
    private MajorSummaryResponse major;
    private List<MajorSummaryResponse> majors;
}
