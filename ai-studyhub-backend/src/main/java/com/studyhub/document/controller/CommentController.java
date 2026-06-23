package com.studyhub.document.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.document.dto.CommentRequest;
import com.studyhub.document.dto.CommentResponse;
import com.studyhub.document.service.CommentService;
import com.studyhub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Comments Management", description = "Threaded academic document comments APIs")
public class CommentController {

    private final CommentService commentService;

    // API thêm bình luận mới vào tài liệu
    @PostMapping("/documents/{documentId}/comments")
    @Operation(summary = "Add a comment to a document", description = "Creates a new comment (or reply to an existing parent comment) on the specified document.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment added successfully")
    })
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long documentId,
            @Valid @RequestBody CommentRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        CommentResponse response = commentService.addComment(documentId, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Bình luận thành công", response));
    }

    // API lấy cây danh sách bình luận của tài liệu
    @GetMapping("/documents/{documentId}/comments")
    @Operation(summary = "Get document threaded comments", description = "Retrieves a list of root-level comments with recursively populated child replies.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comments retrieved successfully")
    })
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getComments(@PathVariable Long documentId) {
        List<CommentResponse> response = commentService.getCommentsByDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách bình luận thành công", response));
    }

    // API chỉnh sửa bình luận
    @PutMapping("/comments/{commentId}")
    @Operation(summary = "Update a comment", description = "Edits the content of an existing comment. Only the author can perform this action.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment updated successfully")
    })
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        CommentResponse response = commentService.updateComment(commentId, request, email);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật bình luận thành công", response));
    }

    // API xóa bình luận
    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete a comment", description = "Performs soft delete on a comment. Can be performed by author or document owner.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Comment deleted successfully")
    })
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long commentId) {
        String email = SecurityUtils.getCurrentUserEmail();
        commentService.deleteComment(commentId, email);
        return ResponseEntity.ok(ApiResponse.ok("Xóa bình luận thành công"));
    }
}
