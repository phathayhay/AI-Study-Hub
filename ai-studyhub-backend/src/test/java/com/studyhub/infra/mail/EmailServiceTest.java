package com.studyhub.infra.mail;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailServiceTest {

    @Test
    void sendEmailVerificationEmailUsesHtmlButton() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        EmailService emailService = new EmailService(mailSender);
        ReflectionTestUtils.setField(emailService, "fromEmail", "aistudyhub@example.com");

        String verificationLink = "https://studyhub.example/verify-email?token=test-token";
        emailService.sendEmailVerificationEmail("student@example.com", verificationLink);

        verify(mailSender).send(message);
        assertEquals("Verify your email - AI Study Hub FPT", message.getSubject());
        assertEquals("student@example.com", message.getAllRecipients()[0].toString());

        String html = message.getContent().toString();
        assertTrue(html.contains("Verify Email Address"));
        assertTrue(html.contains("href=\"" + verificationLink + "\""));
    }
}
