package com.studyhub.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminActivityLogResponse {
    private String type;
    private String title;
    private String description;
    private String actor;
    private String target;
    private String status;
    private String tone;
    private LocalDateTime createdAt;
}
