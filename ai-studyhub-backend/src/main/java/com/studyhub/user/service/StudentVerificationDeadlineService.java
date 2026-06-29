package com.studyhub.user.service;

import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentVerificationDeadlineService {

    private final UserRepository userRepository;

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void banExpiredUnverifiedAccounts() {
        LocalDateTime deadline = LocalDateTime.now().minusDays(3);
        List<User> expiredUsers = userRepository.findByVerificationStatusAndStatusNotAndCreatedAtBefore(
                VerificationStatus.UNVERIFIED,
                UserStatus.BANNED,
                deadline
        );

        if (expiredUsers.isEmpty()) {
            return;
        }

        expiredUsers.forEach(user -> user.setStatus(UserStatus.BANNED));
        userRepository.saveAll(expiredUsers);
        log.info("Auto-banned {} unverified account(s) older than 3 days", expiredUsers.size());
    }
}
