package com.studyhub.document.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.document.dto.DocumentResponse;
import com.studyhub.document.dto.RatingRequest;
import com.studyhub.document.dto.ReportRequest;
import com.studyhub.document.dto.ShareRequest;
import com.studyhub.document.service.CommunityService;
import com.studyhub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Community Features", description = "Ratings, favorites, sharing, and reporting APIs")
public class CommunityController {

    private final CommunityService communityService;

    // ==========================================
    // 1. RATINGS (ĐÁNH GIÁ TÀI LIỆU)
    // ==========================================
    @PostMapping("/{id}/ratings")
    @Operation(summary = "Rate a document", description = "Submits or updates a 1-to-5 star rating for the document. Re-calculates and updates average score.")
    public ResponseEntity<ApiResponse<Void>> rateDocument(
            @PathVariable Long id,
            @Valid @RequestBody RatingRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        communityService.rateDocument(id, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Đánh giá tài liệu thành công"));
    }

    // ==========================================
    // 2. FAVORITES (YÊU THÍCH TÀI LIỆU)
    // ==========================================
    @PostMapping("/{id}/favorite")
    @Operation(summary = "Add document to favorites", description = "Adds the specified document to the user's favorite/bookmark list.")
    public ResponseEntity<ApiResponse<Void>> addFavorite(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        communityService.addFavorite(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Đã thêm vào danh sách yêu thích"));
    }

    @DeleteMapping("/{id}/favorite")
    @Operation(summary = "Remove document from favorites", description = "Removes the specified document from the user's favorite list.")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        communityService.removeFavorite(id, email);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa khỏi danh sách yêu thích"));
    }

    @GetMapping("/favorites")
    @Operation(summary = "Get user's favorite documents", description = "Retrieves a paginated list of documents favorited by the logged-in user.")
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> getUserFavorites(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        String email = SecurityUtils.getCurrentUserEmail();
        Pageable pageable = PageRequest.of(page, size);
        Page<DocumentResponse> response = communityService.getUserFavorites(email, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách yêu thích thành công", response));
    }

    // ==========================================
    // 3. DOCUMENT SHARING (CHIA SẺ)
    // ==========================================
    @PostMapping("/{id}/share")
    @Operation(summary = "Share document with user", description = "Grants view/edit access permissions of an owned document to another user by email.")
    public ResponseEntity<ApiResponse<Void>> shareDocument(
            @PathVariable Long id,
            @Valid @RequestBody ShareRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        communityService.shareDocument(id, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Chia sẻ tài liệu thành công"));
    }

    @GetMapping("/shared")
    @Operation(summary = "Get documents shared with me", description = "Retrieves a paginated list of documents shared with the currently logged-in user.")
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> getSharedDocuments(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        String email = SecurityUtils.getCurrentUserEmail();
        Pageable pageable = PageRequest.of(page, size);
        Page<DocumentResponse> response = communityService.getSharedDocuments(email, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách tài liệu được chia sẻ thành công", response));
    }

    // ==========================================
    // 4. REPORTS (BÁO CÁO)
    // ==========================================
    @PostMapping("/{id}/report")
    @Operation(summary = "Report a document violation", description = "Submits a violation report for the specified document (Spam, Inappropriate, Copyright, etc.).")
    public ResponseEntity<ApiResponse<Void>> reportDocument(
            @PathVariable Long id,
            @Valid @RequestBody ReportRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        communityService.reportDocument(id, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Báo cáo vi phạm đã được gửi thành công"));
    }
}
