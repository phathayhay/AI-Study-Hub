package com.studyhub.chat.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionResponse {
    private Long id;
    private Long documentId;
    private String documentTitle;
    private String sessionTitle;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
