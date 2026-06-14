package com.studyhub.user.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.user.dto.LoginRequest;
import com.studyhub.user.dto.RefreshTokenRequest;
import com.studyhub.user.dto.RegisterRequest;
import com.studyhub.user.dto.TokenResponse;
import com.studyhub.user.dto.ForgotPasswordRequest;
import com.studyhub.user.dto.ResetPasswordRequest;
import com.studyhub.user.dto.ChangePasswordRequest;
import com.studyhub.security.SecurityUtils;
import com.studyhub.user.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and account management APIs")
public class AuthController {

    private final AuthService authService;

    // API đăng ký tài khoản sinh viên mới
    @PostMapping("/register")
    @Operation(summary = "Register a new student account", description = "Creates a new student account with default USER role and FREE subscription plan.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Registration successful, returns access and refresh tokens"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input data or email already in use"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<TokenResponse>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("API: Registering user with email {}", request.getEmail());
        TokenResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("User registered successfully", response));
    }

    // API đăng nhập tài khoản người dùng
    @PostMapping("/login")
    @Operation(summary = "User login authentication", description = "Validates user credentials and issues JWT Access Token and Refresh Token.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, returns token pair"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Incorrect email or password"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "User account has been banned"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<TokenResponse>> login(@Valid @RequestBody LoginRequest request) {
        log.info("API: Logging in user with email {}", request.getEmail());
        TokenResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    // API làm mới Access Token bằng Refresh Token
    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT Access Token", description = "Accepts a valid refresh token and issues a new access token and rotated refresh token.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid, revoked, or expired refresh token"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("API: Refreshing token");
        TokenResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok("Token refreshed successfully", response));
    }

    // API đăng xuất, xóa Refresh Token khỏi hệ thống
    @PostMapping("/logout")
    @Operation(summary = "Logout user session", description = "Revokes and deletes the active session refresh token from database.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logged out successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("API: Logging out and revoking token");
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.ok("Logged out successfully"));
    }

    // API yêu cầu gửi mail reset mật khẩu
    @PostMapping("/forgot-password")
    @Operation(summary = "Request password recovery link", description = "Accepts user email and sends a password recovery email containing a reset link valid for 15 minutes.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Recovery link sent successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email address not found in the system"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error or email dispatch failure")
    })
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("API: Forgot password request for email {}", request.getEmail());
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password reset link has been sent to your email"));
    }

    // API đặt lại mật khẩu mới bằng token nhận được từ mail
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using recovery token", description = "Accepts a recovery token and updates the account password.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successful"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Token is invalid, revoked, or expired"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("API: Reset password request");
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.ok("Password reset successful"));
    }

    // API đổi mật khẩu (yêu cầu người dùng đăng nhập)
    @PostMapping("/change-password")
    @Operation(summary = "Change password (Authenticated)", description = "Updates password for currently authenticated user after validating their old password.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password changed successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Incorrect old password or invalid new password"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        log.info("API: Changing password for user {}", currentEmail);
        authService.changePassword(currentEmail, request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully"));
    }
}


