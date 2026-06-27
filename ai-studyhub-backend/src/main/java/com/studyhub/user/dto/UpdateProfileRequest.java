package com.studyhub.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @NotBlank(message = "First name cannot be blank")
    @Size(max = 50, message = "First name must be at most 50 characters")
    private String firstName;

    @NotBlank(message = "Last name cannot be blank")
    @Size(max = 50, message = "Last name must be at most 50 characters")
    private String lastName;

    private String campus; // Optional, e.g. "HCM", "HN", "DN", "CT", "QN"
    private Long majorId;  // Optional major ID
    private String currentSemester; // Optional, e.g. "Semester 3"
}
