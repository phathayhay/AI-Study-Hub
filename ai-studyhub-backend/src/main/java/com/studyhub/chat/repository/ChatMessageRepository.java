package com.studyhub.chat.repository;

import com.studyhub.chat.entity.ChatMessage;
import com.studyhub.common.enums.SenderType;
import com.studyhub.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findBySession_IdOrderByCreatedAtAsc(Long sessionId);

    @Query("""
            SELECT COUNT(m)
            FROM ChatMessage m
            WHERE m.session.user.id = :userId
              AND m.senderType = :senderType
              AND m.createdAt >= :startOfDay
              AND m.createdAt < :endOfDay
            """)
    long countByUserIdAndSenderTypeBetween(
            @Param("userId") Long userId,
            @Param("senderType") SenderType senderType,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );
}
