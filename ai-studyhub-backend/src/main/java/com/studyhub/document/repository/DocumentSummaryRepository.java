package com.studyhub.document.repository;

import com.studyhub.document.entity.DocumentSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DocumentSummaryRepository extends JpaRepository<DocumentSummary, Long> {
    Optional<DocumentSummary> findByDocument_Id(Long documentId);
}
