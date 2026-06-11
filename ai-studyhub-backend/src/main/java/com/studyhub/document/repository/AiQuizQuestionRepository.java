package com.studyhub.document.repository;

import com.studyhub.document.entity.AiQuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiQuizQuestionRepository extends JpaRepository<AiQuizQuestion, Long> {
    List<AiQuizQuestion> findByQuizIdOrderBySortOrderAsc(Long quizId);
}
