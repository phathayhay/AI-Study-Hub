package com.studyhub.user.dto;

import com.studyhub.common.enums.Campus;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String avatarUrl;
    private Campus campus;
    private String majorName;
    private Long majorId;
    private String planName;
    private LocalDateTime planExpiresAt;
    private String currentSemester;
    private UserStatus status;
    private VerificationStatus verificationStatus;
    private Boolean verificationRequestSubmitted;
    private String verificationReviewNote;
    private String role;
}
