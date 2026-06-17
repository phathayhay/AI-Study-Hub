package com.studyhub.user.repository;

import com.studyhub.user.entity.StudentVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StudentVerificationRepository extends JpaRepository<StudentVerification, Long> {
    Optional<StudentVerification> findByUserId(Long userId);
}
