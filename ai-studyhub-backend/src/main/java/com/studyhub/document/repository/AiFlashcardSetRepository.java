package com.studyhub.document.repository;

import com.studyhub.document.entity.AiFlashcardSet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiFlashcardSetRepository extends JpaRepository<AiFlashcardSet, Long> {
    List<AiFlashcardSet> findByDocumentId(Long documentId);
    List<AiFlashcardSet> findByUserId(Long userId);
}
