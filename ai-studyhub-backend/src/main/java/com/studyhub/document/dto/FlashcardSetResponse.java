package com.studyhub.document.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardSetResponse {
    private Long id;
    private Long documentId;
    private Long userId;
    private String setName;
    private String description;
    private Integer totalCards;
    private LocalDateTime createdAt;
    private List<FlashcardDto> cards;
}
