package com.studyhub.user.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
    private String email;
    private String role;
    private String fullName;
    private String studentCode;
}
