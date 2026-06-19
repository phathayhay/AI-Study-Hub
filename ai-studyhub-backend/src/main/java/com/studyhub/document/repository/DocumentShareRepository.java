package com.studyhub.document.repository;

import com.studyhub.document.entity.DocumentShare;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {
    Optional<DocumentShare> findByDocumentIdAndSharedUserId(Long documentId, Long sharedUserId);
    Page<DocumentShare> findBySharedUserId(Long sharedUserId, Pageable pageable);
}
