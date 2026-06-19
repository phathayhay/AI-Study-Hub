package com.studyhub.chat.repository;

import com.studyhub.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(Long sessionId);
}
