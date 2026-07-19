package com.studyhub.document.service;

import com.studyhub.common.enums.ReportStatus;
import com.studyhub.document.dto.DocumentResponse;
import com.studyhub.document.dto.RatingRequest;
import com.studyhub.document.dto.ReportRequest;
import com.studyhub.document.dto.ShareRequest;
import com.studyhub.document.entity.*;
import com.studyhub.document.entity.DocumentRating.DocumentRatingId;
import com.studyhub.document.entity.Favorite.FavoriteId;
import com.studyhub.document.repository.*;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommunityService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentRatingRepository documentRatingRepository;
    private final FavoriteRepository favoriteRepository;
    private final DocumentShareRepository documentShareRepository;
    private final ReportRepository reportRepository;
    private final DocumentService documentService;

    // ==========================================
    // 1. RATINGS (ĐÁNH GIÁ TÀI LIỆU)
    // ==========================================
    @Transactional
    public void rateDocument(Long documentId, RatingRequest request, String email) {
        log.info("User {} rating document ID {} with {}", email, documentId, request.getRating());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        // Không cho phép đánh giá nếu tài liệu chưa duyệt hoặc tài liệu private của người khác
        if (!documentService.canAccessDocument(doc, user)) {
            throw new SecurityException("Bạn không có quyền đánh giá tài liệu này");
        }

        DocumentRatingId id = new DocumentRatingId(user.getId(), doc.getId());
        
        DocumentRating documentRating = documentRatingRepository.findByUserIdAndDocumentId(user.getId(), doc.getId())
                .orElse(null);

        if (documentRating == null) {
            documentRating = DocumentRating.builder()
                    .id(id)
                    .user(user)
                    .document(doc)
                    .rating(request.getRating())
                    .build();
        } else {
            documentRating.setRating(request.getRating());
        }

        documentRatingRepository.save(documentRating);
        updateDocumentAverageRating(doc);
    }

    private void updateDocumentAverageRating(Document doc) {
        Double avg = documentRatingRepository.getAverageRatingByDocumentId(doc.getId());
        if (avg == null) {
            avg = 0.0;
        }
        doc.setAverageRating(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
        documentRepository.save(doc);
    }

    // ==========================================
    // 2. FAVORITES (YÊU THÍCH TÀI LIỆU)
    // ==========================================
    @Transactional
    public void addFavorite(Long documentId, String email) {
        log.info("User {} adding document ID {} to favorites", email, documentId);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!documentService.canAccessDocument(doc, user)) {
            throw new SecurityException("Bạn không có quyền yêu thích tài liệu này");
        }

        FavoriteId id = new FavoriteId(user.getId(), doc.getId());
        if (favoriteRepository.findByUserIdAndDocumentId(user.getId(), doc.getId()).isPresent()) {
            return; // Đã yêu thích rồi
        }

        Favorite favorite = Favorite.builder()
                .id(id)
                .user(user)
                .document(doc)
                .build();
        favoriteRepository.save(favorite);
    }

    @Transactional
    public void removeFavorite(Long documentId, String email) {
        log.info("User {} removing document ID {} from favorites", email, documentId);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        favoriteRepository.findByUserIdAndDocumentId(user.getId(), documentId)
                .ifPresent(favoriteRepository::delete);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> getUserFavorites(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Page<Favorite> favorites = favoriteRepository.findByUserId(user.getId(), pageable);
        return favorites.map(fav -> documentService.mapToResponse(fav.getDocument()));
    }

    // ==========================================
    // 3. DOCUMENT SHARING (CHIA SẺ QUYỀN TRUY CẬP)
    // ==========================================
    @Transactional
    public void shareDocument(Long documentId, ShareRequest request, String ownerEmail) {
        log.info("User {} sharing document ID {} with {}", ownerEmail, documentId, request.getSharedUserEmail());

        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!doc.getUser().getId().equals(owner.getId())) {
            throw new SecurityException("Chỉ chủ sở hữu mới có quyền chia sẻ tài liệu này");
        }

        User sharedWithUser = userRepository.findByEmail(request.getSharedUserEmail().trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản được chia sẻ"));

        if (sharedWithUser.getId().equals(owner.getId())) {
            throw new IllegalArgumentException("Bạn không thể tự chia sẻ tài liệu cho chính mình");
        }

        DocumentShare share = documentShareRepository.findByDocumentIdAndSharedUserId(documentId, sharedWithUser.getId())
                .orElse(null);

        if (share == null) {
            share = DocumentShare.builder()
                    .document(doc)
                    .sharedUser(sharedWithUser)
                    .owner(owner)
                    .permission(request.getPermission())
                    .build();
        } else {
            share.setPermission(request.getPermission());
        }

        documentShareRepository.save(share);
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> getSharedDocuments(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Page<DocumentShare> shares = documentShareRepository.findBySharedUserId(user.getId(), pageable);
        return shares.map(share -> documentService.mapToResponse(share.getDocument()));
    }

    // ==========================================
    // 4. REPORTS (BÁO CÁO VI PHẠM)
    // ==========================================
    @Transactional
    public void reportDocument(Long documentId, ReportRequest request, String reporterEmail) {
        log.info("User {} reporting document ID {} for {}", reporterEmail, documentId, request.getReportType());

        User reporter = userRepository.findByEmail(reporterEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (reportRepository.existsByReporterIdAndDocumentId(reporter.getId(), doc.getId())) {
            throw new IllegalStateException("Bạn đã gửi báo cáo vi phạm cho tài liệu này trước đó rồi.");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .document(doc)
                .reportType(request.getReportType())
                .reportReason(request.getReportReason())
                .status(ReportStatus.PENDING)
                .build();

        reportRepository.save(report);
    }
}
