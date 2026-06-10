package com.studyhub.document.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizResponse {
    private Long id;
    private Long documentId;
    private Long userId;
    private String quizTitle;
    private Integer totalQuestions;
    private String difficultyLevel;
    private LocalDateTime createdAt;
    private List<QuizQuestionDto> questions;
}
