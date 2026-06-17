package com.studyhub.document.repository;

import com.studyhub.document.entity.DocumentDownload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentDownloadRepository extends JpaRepository<DocumentDownload, Long> {
    List<DocumentDownload> findByUserId(Long userId);
}
