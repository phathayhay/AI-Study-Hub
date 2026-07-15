package com.studyhub.user.dto;

import com.studyhub.common.enums.Campus;
import com.studyhub.common.enums.StorageStatus;
import com.studyhub.common.enums.VerificationStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenResponse {
    private Long id;
    private String accessToken;
    private String refreshToken;
    private String email;
    private String role;
    private String firstName;
    private String lastName;
    private String fullName;
    private String avatarUrl;
    private Campus campus;
    private String majorName;
    private Long majorId;
    private String currentSemester;
    private VerificationStatus verificationStatus;
    private String planName;
    private LocalDateTime planExpiresAt;
    private Long planStorageLimitMb;
    private Long planStorageLimitBytes;
    private Long planStorageUsedBytes;
    private Double planStorageUsedMb;
    private StorageStatus storageStatus;
    private Boolean overQuota;
    private Boolean canUpload;
    private String storageMessage;
}
