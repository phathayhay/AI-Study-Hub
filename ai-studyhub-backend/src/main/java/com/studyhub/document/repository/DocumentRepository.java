package com.studyhub.document.repository;

import com.studyhub.common.enums.ModerationStatus;
import com.studyhub.common.enums.Visibility;
import com.studyhub.document.entity.Document;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {
    List<Document> findByUserId(Long userId);
    List<Document> findByFolderId(Long folderId);
    List<Document> findByFolderIdIsNullAndUserId(Long userId);
    List<Document> findByCourseId(Long courseId);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.course.id = :courseId AND d.visibility = :visibility AND d.moderationStatus = :status")
    long countByCourseIdAndVisibilityAndModerationStatus(
            @Param("courseId") Long courseId,
            @Param("visibility") Visibility visibility,
            @Param("status") ModerationStatus status);

    @Query("SELECT COALESCE(SUM(d.totalDownloads), 0) FROM Document d WHERE d.course.id = :courseId AND d.visibility = :visibility AND d.moderationStatus = :status")
    long sumDownloadsByCourseIdAndVisibilityAndModerationStatus(
            @Param("courseId") Long courseId,
            @Param("visibility") Visibility visibility,
            @Param("status") ModerationStatus status);

    @Modifying
    @Query("UPDATE Document d SET d.totalDownloads = d.totalDownloads + 1 WHERE d.id = :documentId")
    int incrementTotalDownloads(@Param("documentId") Long documentId);
}
