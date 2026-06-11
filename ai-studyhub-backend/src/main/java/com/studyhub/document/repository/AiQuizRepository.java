package com.studyhub.document.repository;

import com.studyhub.document.entity.AiQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiQuizRepository extends JpaRepository<AiQuiz, Long> {
    List<AiQuiz> findByDocumentId(Long documentId);
    List<AiQuiz> findByUserId(Long userId);
}
