package com.studyhub.course.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MajorSummaryResponse {
    private Long id;
    private String majorCode;
    private String majorName;
}
