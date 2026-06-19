package com.studyhub.document.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentRequest {

    @NotBlank(message = "Nội dung bình luận không được để trống")
    private String content;

    private Long parentCommentId;
}
