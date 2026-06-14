package com.studyhub.user.dto;

import com.studyhub.common.enums.Campus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Student code cannot be blank")
    @Size(max = 20, message = "Student code must be at most 20 characters")
    private String studentCode;

    @NotBlank(message = "Full name cannot be blank")
    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Invalid email address")
    @Size(max = 150, message = "Email must be at most 150 characters")
    private String email;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Campus cannot be null")
    private Campus campus;

    @NotNull(message = "Major ID cannot be null")
    private Long majorId;

    @Size(max = 20, message = "Current semester must be at most 20 characters")
    private String currentSemester;
}
