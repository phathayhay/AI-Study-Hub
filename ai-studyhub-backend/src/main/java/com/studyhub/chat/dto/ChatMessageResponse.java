package com.studyhub.chat.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageResponse {
    private Long id;
    private String senderType;
    private String messageContent;
    private LocalDateTime createdAt;
}
