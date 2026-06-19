package com.studyhub.chat.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateSessionRequest {
    private Long documentId;
    private String sessionTitle;
}
