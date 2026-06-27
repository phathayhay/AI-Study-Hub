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
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    @Operation(summary = "Register a new student account", description = "Creates a new student account with default USER role and FREE subscription plan. Account is initially INACTIVE and requires email verification.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Registration successful, email verification link sent", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Registration successful. Please check your email to verify your account.\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input data or email already in use", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Email is already in use\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        log.info("API: Registering user with email {}", request.getEmail());
        authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("Registration successful. Please check your email to verify your account."));
    }

    // API xác thực email tài khoản
    @GetMapping("/verify-email")
    @Operation(summary = "Verify student email", description = "Validates the verification token sent via email and activates the user account.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Email verified successfully, account activated", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Email verified successfully. You can now log in.\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired verification token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Verification token is invalid or has expired\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
        log.info("API: Verifying email using token");
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully. You can now log in."));
    }

    // API đăng nhập tài khoản người dùng
    @PostMapping("/login")
    @Operation(summary = "User login authentication", description = "Validates user credentials and issues JWT Access Token and Refresh Token.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, returns token pair", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Login successful\", \"data\": {\"accessToken\": \"eyJhbGciOiJIUzI1NiJ9...\", \"refreshToken\": \"7b47e4b9-87a4-4a41-b0e6-b63e800ebefc\", \"email\": \"student@fpt.edu.vn\", \"role\": \"USER\", \"fullName\": \"Nguyen Van A\", \"studentCode\": \"SE160000\"}, \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Incorrect email or password", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Incorrect email or password\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "User account has been banned", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Your account has been banned\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
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
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Token refreshed successfully\", \"data\": {\"accessToken\": \"eyJhbGciOiJIUzI1NiJ9...\", \"refreshToken\": \"7b47e4b9-87a4-4a41-b0e6-b63e800ebefc\", \"email\": \"student@fpt.edu.vn\", \"role\": \"USER\", \"fullName\": \"Nguyen Van A\", \"studentCode\": \"SE160000\"}, \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid, revoked, or expired refresh token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Invalid refresh token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
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
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logged out successfully", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Logged out successfully\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
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
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Recovery link sent successfully", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Password reset link has been sent to your email\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Email address not found in the system", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Account with this email does not exist\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error or email dispatch failure", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Failed to send email, please try again later\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
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
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successful", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Password reset successful\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Token is invalid, revoked, or expired", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Reset token is invalid or has expired\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
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
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password changed successfully", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiResponse.class), examples = @ExampleObject(value = "{\"success\": true, \"message\": \"Password changed successfully\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Incorrect old password or invalid new password", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Incorrect old password\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String currentEmail = SecurityUtils.getCurrentUserEmail();
        log.info("API: Changing password for user {}", currentEmail);
        authService.changePassword(currentEmail, request);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully"));
    }

    // API gửi lại email xác thực
    @PostMapping("/send-verify-email")
    @Operation(summary = "Resend verification email", description = "Resends the account verification email link if the user has not verified it yet.")
    public ResponseEntity<ApiResponse<Void>> resendVerificationEmail(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("API: Resending verification email for {}", request.getEmail());
        authService.resendVerificationEmail(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Verification email has been resent successfully."));
    }
}


