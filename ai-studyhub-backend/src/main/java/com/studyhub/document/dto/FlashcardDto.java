package com.studyhub.document.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FlashcardDto {
    private Long id;
    private String frontContent;
    private String backContent;
    private Integer sortOrder;
}
