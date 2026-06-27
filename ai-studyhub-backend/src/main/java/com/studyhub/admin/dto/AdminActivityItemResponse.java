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
public class AdminActivityItemResponse {
    private String title;
    private String text;
    private String tone;
    private LocalDateTime createdAt;
}
