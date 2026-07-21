package com.studyhub.user.service;

import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.course.repository.MajorRepository;
import com.studyhub.infra.mail.EmailService;
import com.studyhub.security.JwtTokenProvider;
import com.studyhub.user.dto.RegisterRequest;
import com.studyhub.user.entity.Role;
import com.studyhub.user.entity.SubscriptionPlan;
import com.studyhub.user.entity.SubscriptionPlanVersion;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.RefreshTokenRepository;
import com.studyhub.user.repository.RoleRepository;
import com.studyhub.user.repository.SubscriptionPlanRepository;
import com.studyhub.user.repository.SubscriptionPlanVersionRepository;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.repository.UserSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceRegistrationTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private MajorRepository majorRepository;
    @Mock private UserSubscriptionRepository userSubscriptionRepository;
    @Mock private SubscriptionPlanVersionRepository subscriptionPlanVersionRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository, roleRepository, subscriptionPlanRepository,
                refreshTokenRepository, majorRepository, userSubscriptionRepository,
                subscriptionPlanVersionRepository, passwordEncoder, jwtTokenProvider,
                authenticationManager, emailService, notificationService);
        ReflectionTestUtils.setField(authService, "frontendUrl", "http://localhost:5173");

        Role role = new Role(1L, "USER");
        SubscriptionPlan freePlan = SubscriptionPlan.builder()
                .id(1L)
                .planName("FREE")
                .price(BigDecimal.ZERO)
                .storageLimitMb(50L)
                .aiRequestsPerDay(10)
                .build();
        SubscriptionPlanVersion freeVersion = SubscriptionPlanVersion.builder()
                .id(1L)
                .plan(freePlan)
                .versionNumber(1)
                .build();

        when(roleRepository.findByRoleName("USER")).thenReturn(Optional.of(role));
        when(subscriptionPlanRepository.findByPlanName("FREE")).thenReturn(Optional.of(freePlan));
        when(subscriptionPlanVersionRepository.findFirstByPlan_IdOrderByVersionNumberDesc(1L))
                .thenReturn(Optional.of(freeVersion));
        when(passwordEncoder.encode("secret1")).thenReturn("encoded-password");
        when(jwtTokenProvider.generateEmailVerificationToken(any()))
                .thenReturn("verification-token");
    }

    @Test
    void registerFptEmail_RequiresEmailVerificationButSkipsStudentCardVerification() {
        authService.register(request("student@fpt.edu.vn"));

        User savedUser = captureSavedUser();
        assertEquals(UserStatus.INACTIVE, savedUser.getStatus());
        assertEquals(VerificationStatus.APPROVED, savedUser.getVerificationStatus());
        verify(emailService).sendEmailVerificationEmail(
                "student@fpt.edu.vn",
                "http://localhost:5173/verify-email?token=verification-token");
    }

    @Test
    void registerRegularEmail_RequiresEmailAndStudentCardVerification() {
        authService.register(request("student@gmail.com"));

        User savedUser = captureSavedUser();
        assertEquals(UserStatus.INACTIVE, savedUser.getStatus());
        assertEquals(VerificationStatus.UNVERIFIED, savedUser.getVerificationStatus());
        verify(emailService).sendEmailVerificationEmail(
                "student@gmail.com",
                "http://localhost:5173/verify-email?token=verification-token");
    }

    private User captureSavedUser() {
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        return captor.getValue();
    }

    private RegisterRequest request(String email) {
        return RegisterRequest.builder()
                .firstName("Test")
                .lastName("Student")
                .email(email)
                .password("secret1")
                .build();
    }
}
