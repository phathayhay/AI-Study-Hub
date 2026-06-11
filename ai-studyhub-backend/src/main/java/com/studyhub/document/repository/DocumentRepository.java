package com.studyhub.document.repository;

import com.studyhub.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserId(Long userId);
    List<Document> findByFolderId(Long folderId);
    List<Document> findByFolderIdIsNullAndUserId(Long userId);
    List<Document> findByCourseId(Long courseId);
}
