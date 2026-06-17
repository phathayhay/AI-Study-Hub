package com.studyhub.document.repository;

import com.studyhub.document.entity.DocumentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRatingRepository extends JpaRepository<DocumentRating, com.studyhub.document.entity.DocumentRating.DocumentRatingId> {
    Optional<DocumentRating> findByUserIdAndDocumentId(Long userId, Long documentId);
    List<DocumentRating> findByDocumentId(Long documentId);

    @Query("SELECT AVG(r.rating) FROM DocumentRating r WHERE r.document.id = :documentId")
    Double getAverageRatingByDocumentId(@Param("documentId") Long documentId);
}
