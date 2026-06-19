package com.studyhub.chat.repository;

import com.studyhub.chat.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUser_EmailOrderByUpdatedAtDesc(String email);
    Optional<ChatSession> findByIdAndUser_Email(Long id, String email);
}
