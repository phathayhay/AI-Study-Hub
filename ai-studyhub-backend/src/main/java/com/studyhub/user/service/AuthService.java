package com.studyhub.user.service;

import com.studyhub.common.enums.Campus;
import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.course.entity.Major;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.security.JwtTokenProvider;
import com.studyhub.user.dto.LoginRequest;
import com.studyhub.user.dto.RefreshTokenRequest;
import com.studyhub.user.dto.RegisterRequest;
import com.studyhub.user.dto.TokenResponse;
import com.studyhub.user.entity.RefreshToken;
import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.RefreshTokenRepository;
import com.studyhub.user.repository.RoleRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.dto.ForgotPasswordRequest;
import com.studyhub.user.dto.ResetPasswordRequest;
import com.studyhub.user.dto.ChangePasswordRequest;
import com.studyhub.common.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MajorRepository majorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * Đăng ký tài khoản sinh viên mới.
     * Mặc định gán vai trò USER và gói dịch vụ FREE, mã hóa mật khẩu trước khi lưu.
     */
    @Transactional
    public void register(RegisterRequest request) {
        log.info("Registering user with email: {}", request.getEmail());

        // 0. Validate Password Confirmation
        if (request.getPassword() == null || !request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không trùng khớp");
        }

        // 1. Determine Verification Status based on Email Domain
        String email = request.getEmail().trim().toLowerCase();
        VerificationStatus initialVerificationStatus = VerificationStatus.PENDING;
        if (email.endsWith("@fpt.edu.vn") || email.endsWith("@fe.edu.vn")) {
            initialVerificationStatus = VerificationStatus.APPROVED;
        }

        // 2. Validate Student Code format (e.g. SE160000, MC160000, MKT16000)
        String studentCode = request.getStudentCode().trim().toUpperCase();
        if (!studentCode.matches("^[A-Z]{2,4}\\d{5,7}$")) {
            throw new IllegalArgumentException("Mã sinh viên không đúng định dạng (Ví dụ: SE160000)");
        }

        // 3. Validate Email Uniqueness
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already in use");
        }

        // 4. Validate Student Code Uniqueness
        if (userRepository.existsByStudentCode(studentCode)) {
            throw new IllegalArgumentException("Student code is already in use");
        }

        // Lấy hoặc tạo vai trò USER mặc định
        Role userRole = roleRepository.findByRoleName("USER")
                .orElseGet(() -> roleRepository.save(new Role(null, "USER")));

        // Lấy hoặc tạo gói dịch vụ FREE mặc định
        SubscriptionPlan freePlan = subscriptionPlanRepository.findByPlanName("FREE")
                .orElseGet(() -> {
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .planName("FREE")
                            .description("Gói mặc định miễn phí")
                            .price(BigDecimal.ZERO)
                            .storageLimitMb(500L)
                            .aiRequestsPerDay(10)
                            .isActive(true)
                            .build();
                    return subscriptionPlanRepository.save(plan);
                });

        User user = User.builder()
                .studentCode(studentCode)
                .fullName(request.getFullName().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .campus(Campus.HCM)
                .major(null)
                .plan(freePlan)
                .role(userRole)
                .currentSemester(null)
                .status(UserStatus.INACTIVE) // Requires email verification
                .verificationStatus(initialVerificationStatus)
                .build();
 
         userRepository.save(user);
 
         // Generate email verification token and send verification email
         try {
             String verificationToken = jwtTokenProvider.generateEmailVerificationToken(user.getEmail());
             String verificationLink = frontendUrl + "/verify-email?token=" + verificationToken;
             emailService.sendEmailVerificationEmail(user.getEmail(), verificationLink);
         } catch (Exception e) {
             log.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
             throw new IllegalStateException("Không thể gửi email xác nhận tài khoản: " + e.getMessage());
         }
     }

    /**
     * Đăng nhập vào hệ thống.
     * Kiểm tra thông tin đăng nhập, sinh Access Token JWT và lưu Refresh Token.
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        log.info("Authenticating user: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found after authentication"));

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Please verify your email address before logging in");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("Your account has been banned");
        }

        String accessToken = jwtTokenProvider.generateToken(userDetails);
        String refreshToken = generateAndSaveRefreshToken(user);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getRoleName() : "USER")
                .fullName(user.getFullName())
                .studentCode(user.getStudentCode())
                .build();
    }

    /**
     * Làm mới token truy cập (Access Token).
     * Kiểm tra tính hợp lệ của Refresh Token, sinh Access Token mới và thực hiện xoay vòng Refresh Token.
     */
    @Transactional
    public TokenResponse refresh(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        log.info("Refreshing token");

        RefreshToken oldRefreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (oldRefreshToken.getRevoked()) {
            throw new IllegalArgumentException("Refresh token has been revoked");
        }

        if (oldRefreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Refresh token has expired");
        }

        User user = oldRefreshToken.getUser();
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new IllegalStateException("Please verify your email address before logging in");
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("Your account has been banned");
        }

        // Tạo lại đối tượng UserDetails cho token mới
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        user.getRole() != null
                                ? java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName()))
                                : java.util.List.of()
                );

        String newAccessToken = jwtTokenProvider.generateToken(userDetails);

        // Xoay vòng Refresh Token: Xóa token cũ và tạo mới
        refreshTokenRepository.delete(oldRefreshToken);
        String newRefreshToken = generateAndSaveRefreshToken(user);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().getRoleName() : "USER")
                .fullName(user.getFullName())
                .studentCode(user.getStudentCode())
                .build();
    }

    /**
     * Đăng xuất khỏi hệ thống.
     * Xóa Refresh Token tương ứng trong Database để kết thúc phiên làm việc.
     */
    @Transactional
    public void logout(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();
        log.info("Revoking refresh token on logout");
        refreshTokenRepository.findByToken(tokenStr)
                .ifPresent(refreshTokenRepository::delete);
    }

    /**
     * Sinh và lưu trữ Refresh Token mới trong cơ sở dữ liệu.
     */
    private String generateAndSaveRefreshToken(User user) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(token)
                .expiresAt(LocalDateTime.now().plusDays(7)) // Có hiệu lực trong 7 ngày
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return token;
    }

    /**
     * Xử lý yêu cầu quên mật khẩu.
     * Sinh JWT Token reset tạm thời và gửi email hướng dẫn khôi phục mật khẩu.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Processing forgot password request for: {}", request.getEmail());
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Account with this email does not exist"));

        String resetToken = jwtTokenProvider.generatePasswordResetToken(user.getEmail());
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);
    }

    /**
     * Đặt lại mật khẩu mới thông qua Token phục hồi.
     * Giải mã token, kiểm tra tính hợp lệ và cập nhật mật khẩu đã băm mới, xóa các token phiên đăng nhập cũ.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Resetting password using token");
        String email = jwtTokenProvider.validatePasswordResetToken(request.getToken());
        if (email == null) {
            throw new IllegalArgumentException("Reset token is invalid or has expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found associated with this token"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Xóa toàn bộ refresh token cũ của người dùng vì lý do bảo mật sau khi đổi mật khẩu
        refreshTokenRepository.deleteByUser(user);
    }

    /**
     * Thay đổi mật khẩu khi đang đăng nhập.
     * Kiểm tra mật khẩu cũ trùng khớp và cập nhật mật khẩu mới.
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        log.info("Changing password for user: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect old password");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Confirm password does not match new password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Xác thực tài khoản người dùng bằng email verification token.
     */
    @Transactional
    public void verifyEmail(String token) {
        log.info("Verifying email with token");
        String email = jwtTokenProvider.validateEmailVerificationToken(token);
        if (email == null) {
            throw new IllegalArgumentException("Verification token is invalid or has expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found associated with this token"));

        if (user.getStatus() == UserStatus.ACTIVE) {
            log.info("User {} is already active", email);
            return;
        }

        if (user.getStatus() == UserStatus.BANNED) {
            throw new IllegalStateException("Your account has been banned");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setVerifiedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("User {} successfully activated", email);
    }
}
