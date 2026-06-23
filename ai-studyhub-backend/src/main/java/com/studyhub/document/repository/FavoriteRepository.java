package com.studyhub.document.repository;

import com.studyhub.document.entity.Favorite;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, com.studyhub.document.entity.Favorite.FavoriteId> {
    Optional<Favorite> findByUserIdAndDocumentId(Long userId, Long documentId);
    Page<Favorite> findByUserId(Long userId, Pageable pageable);
}
