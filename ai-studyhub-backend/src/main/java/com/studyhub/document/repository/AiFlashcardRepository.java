package com.studyhub.document.repository;

import com.studyhub.document.entity.AiFlashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AiFlashcardRepository extends JpaRepository<AiFlashcard, Long> {
    List<AiFlashcard> findBySetIdOrderBySortOrderAsc(Long setId);
}
