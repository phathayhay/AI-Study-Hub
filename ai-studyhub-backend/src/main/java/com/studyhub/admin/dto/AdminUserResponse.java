package com.studyhub.admin.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String verificationStatus;
    private String status;
    private String planName;
    private String roleName;
    private LocalDateTime createdAt;
}
