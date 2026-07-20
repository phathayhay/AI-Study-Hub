package com.studyhub.infra.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

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
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail, "AI Study Hub FPT");
            helper.setTo(toEmail);
            helper.setSubject("Verify your email - AI Study Hub FPT");
            helper.setText(buildVerificationEmail(verificationLink), true);
            mailSender.send(message);
            log.info("Email verification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email verification email to {}: {}", toEmail, e.getMessage());
            throw new IllegalStateException("Could not send email verification: " + e.getMessage(), e);
        }
    }

    private String buildVerificationEmail(String verificationLink) {
        String safeVerificationLink = HtmlUtils.htmlEscape(verificationLink);
        return """
                <!doctype html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verify your email</title>
                </head>
                <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#172033;">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:32px 16px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border:1px solid #e3e8f2;border-radius:8px;">
                                    <tr>
                                        <td style="padding:32px;">
                                            <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:24px;">AI Study Hub</div>
                                            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#111827;">Verify your email address</h1>
                                            <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#5b667a;">
                                                Thank you for creating an AI Study Hub account. Confirm your email address to activate your account.
                                            </p>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                                <tr>
                                                    <td style="border-radius:6px;background:#4f46e5;">
                                                        <a href="%s" target="_blank" style="display:inline-block;padding:13px 24px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
                                                            Verify Email Address
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#7b8699;">
                                                If you did not create this account, you can safely ignore this email.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(safeVerificationLink);
    }
}
