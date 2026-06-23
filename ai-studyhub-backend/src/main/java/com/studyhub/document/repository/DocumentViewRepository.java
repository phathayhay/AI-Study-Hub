package com.studyhub.document.repository;

import com.studyhub.document.entity.Document;
import com.studyhub.document.entity.DocumentView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentViewRepository extends JpaRepository<DocumentView, Long> {

    @Query(value = "SELECT v.document FROM DocumentView v WHERE v.user.id = :userId GROUP BY v.document.id ORDER BY MAX(v.viewedAt) DESC",
           countQuery = "SELECT COUNT(DISTINCT v.document.id) FROM DocumentView v WHERE v.user.id = :userId")
    Page<Document> findRecentlyViewedDocuments(@Param("userId") Long userId, Pageable pageable);
}
