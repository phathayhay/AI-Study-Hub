package com.studyhub.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        log.info("Sending password reset email to {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("AI Study Hub FPT <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Yêu cầu đặt lại mật khẩu - AI Study Hub FPT");
            message.setText("Chào bạn,\n\n" +
                    "Bạn nhận được email này vì hệ thống ghi nhận yêu cầu đặt lại mật khẩu của bạn.\n" +
                    "Vui lòng nhấn vào đường dẫn dưới đây để thực hiện thay đổi mật khẩu (đường dẫn có hiệu lực trong 15 phút):\n\n" +
                    resetLink + "\n\n" +
                    "Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email.\n\n" +
                    "Trân trọng,\n" +
                    "Đội ngũ AI Study Hub FPT");
            mailSender.send(message);
            log.info("Password reset email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            throw new IllegalStateException("Could not send password reset email: " + e.getMessage(), e);
        }
    }
 
    public void sendEmailVerificationEmail(String toEmail, String verificationLink) {
        log.info("Sending email verification email to {}", toEmail);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("AI Study Hub FPT <" + fromEmail + ">");
            message.setTo(toEmail);
            message.setSubject("Xác nhận email tài khoản - AI Study Hub FPT");
            message.setText("Chào bạn,\n\n" +
                    "Cảm ơn bạn đã đăng ký tài khoản tại AI Study Hub FPT.\n" +
                    "Vui lòng nhấn vào đường dẫn dưới đây để xác nhận tài khoản của bạn:\n\n" +
                    verificationLink + "\n\n" +
                    "Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email.\n\n" +
                    "Trân trọng,\n" +
                    "Đội ngũ AI Study Hub FPT");
            mailSender.send(message);
            log.info("Email verification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email verification email to {}: {}", toEmail, e.getMessage());
            throw new IllegalStateException("Could not send email verification: " + e.getMessage(), e);
        }
    }
}
