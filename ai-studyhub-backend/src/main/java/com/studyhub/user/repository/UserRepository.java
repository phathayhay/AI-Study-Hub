package com.studyhub.user.repository;

import com.studyhub.common.enums.UserStatus;
import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByVerificationStatusAndStatusNotAndCreatedAtBefore(
            VerificationStatus verificationStatus,
            UserStatus status,
            LocalDateTime createdAt
    );

}

