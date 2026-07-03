package com.studyhub.document.repository;

import com.studyhub.document.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByReporterIdAndDocumentId(Long reporterId, Long documentId);
    int countByDocumentId(Long documentId);
}
