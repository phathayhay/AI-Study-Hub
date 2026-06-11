package com.studyhub.document.repository;

import com.studyhub.document.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUserId(Long userId);
    List<Folder> findByUserIdAndParentFolderIdIsNull(Long userId);
    List<Folder> findByParentFolderId(Long parentFolderId);
    Optional<Folder> findByUserIdAndParentFolderIdAndFolderName(Long userId, Long parentFolderId, String folderName);
    Optional<Folder> findByUserIdAndParentFolderIsNullAndFolderName(Long userId, String folderName);
}
