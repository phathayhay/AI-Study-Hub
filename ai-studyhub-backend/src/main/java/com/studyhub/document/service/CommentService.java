package com.studyhub.document.service;

import com.studyhub.document.dto.CommentRequest;
import com.studyhub.document.dto.CommentResponse;
import com.studyhub.document.entity.Comment;
import com.studyhub.document.entity.Document;
import com.studyhub.document.repository.CommentRepository;
import com.studyhub.document.repository.DocumentRepository;
import com.studyhub.common.enums.NotificationType;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import com.studyhub.user.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final DocumentService documentService;

    @Transactional
    public CommentResponse addComment(Long documentId, CommentRequest request, String email) {
        log.info("User {} adding comment to document ID {}", email, documentId);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Nếu là tài liệu PRIVATE, chỉ chủ sở hữu được bình luận (ngoại trừ trường hợp được share sẽ phát triển sau)
        if (!documentService.canAccessDocument(doc, user)) {
            throw new SecurityException("Bạn không có quyền bình luận trên tài liệu này");
        }

        Comment parent = null;
        if (request.getParentCommentId() != null) {
            parent = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            if (!parent.getDocument().getId().equals(documentId)) {
                throw new IllegalArgumentException("Parent comment does not belong to the same document");
            }
        }

        Comment comment = Comment.builder()
                .user(user)
                .document(doc)
                .parentComment(parent)
                .content(request.getContent().trim())
                .build();

        Comment savedComment = commentRepository.save(comment);
        createCommentNotifications(savedComment, user, doc, parent);
        return mapToResponse(savedComment);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getCommentsByDocument(Long documentId) {
        log.info("Fetching comments for document ID {}", documentId);
        
        if (!documentRepository.existsById(documentId)) {
            throw new IllegalArgumentException("Document not found");
        }

        // Chỉ lấy các bình luận gốc (không có parent) để tạo cây phân cấp
        List<Comment> rootComments = commentRepository.findByDocumentIdAndParentCommentIsNullOrderByCreatedAtAsc(documentId);
        return rootComments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse updateComment(Long commentId, CommentRequest request, String email) {
        log.info("User {} updating comment ID {}", email, commentId);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new SecurityException("Bạn không có quyền chỉnh sửa bình luận này");
        }

        comment.setContent(request.getContent().trim());
        Comment updatedComment = commentRepository.save(comment);
        return mapToResponse(updatedComment);
    }

    @Transactional
    public void deleteComment(Long commentId, String email) {
        log.info("User {} deleting comment ID {}", email, commentId);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        // Người tạo bình luận hoặc chủ sở hữu tài liệu đều có quyền xóa bình luận
        boolean isAuthor = comment.getUser().getId().equals(user.getId());
        boolean isDocOwner = comment.getDocument().getUser().getId().equals(user.getId());
        
        if (!isAuthor && !isDocOwner) {
            throw new SecurityException("Bạn không có quyền xóa bình luận này");
        }

        // Thực hiện soft delete bằng cách đặt deleted_at
        notificationService.deleteNotificationsBySourceCommentId(comment.getId());
        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    private CommentResponse mapToResponse(Comment comment) {
        List<Comment> childComments = commentRepository.findByParentCommentIdOrderByCreatedAtAsc(comment.getId());
        List<CommentResponse> replies = childComments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return CommentResponse.builder()
                .id(comment.getId())
                .userId(comment.getUser().getId())
                .fullName(comment.getUser().getFullName())
                .avatarUrl(comment.getUser().getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .replies(replies)
                .build();
    }

    private void createCommentNotifications(Comment savedComment, User actor, Document document, Comment parent) {
        String actorName = actor.getFullName() != null && !actor.getFullName().isBlank()
                ? actor.getFullName()
                : actor.getEmail();
        String documentTitle = document.getTitle() != null && !document.getTitle().isBlank()
                ? document.getTitle()
                : "your document";

        Long actorId = actor.getId();
        Long parentUserId = parent != null && parent.getUser() != null ? parent.getUser().getId() : null;
        Long documentOwnerId = document.getUser() != null ? document.getUser().getId() : null;

        if (parentUserId != null && !Objects.equals(parentUserId, actorId)) {
            userRepository.findById(parentUserId).ifPresent((recipient) ->
                    notificationService.createNotification(
                            recipient,
                            "Reply to Comment",
                            actorName + " replied to your comment on \"" + documentTitle + "\".",
                            NotificationType.COMMENT,
                            savedComment.getId()
                    )
            );
        }

        if (documentOwnerId != null
                && !Objects.equals(documentOwnerId, actorId)
                && !Objects.equals(documentOwnerId, parentUserId)) {
            userRepository.findById(documentOwnerId).ifPresent((recipient) ->
                    notificationService.createNotification(
                            recipient,
                            parent != null ? "New Reply" : "New Comment",
                            parent != null
                                    ? actorName + " replied in the discussion on your document \"" + documentTitle + "\"."
                                    : actorName + " commented on your document \"" + documentTitle + "\".",
                            NotificationType.COMMENT,
                            savedComment.getId()
                    )
            );
        }
    }
}
