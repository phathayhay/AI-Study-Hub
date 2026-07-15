package com.studyhub.common.service;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Deprecated
public class EmailService extends com.studyhub.infra.mail.EmailService {
    public EmailService(JavaMailSender mailSender) {
        super(mailSender);
    }
}
