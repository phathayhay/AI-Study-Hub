package com.studyhub.document.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyhub.document.dto.DocumentResponse;
import com.studyhub.document.dto.DocumentUploadRequest;
import com.studyhub.document.service.DocumentService;
import com.studyhub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Document Management", description = "Academic document management APIs")
public class DocumentController {

    private final DocumentService documentService;
    private final ObjectMapper objectMapper;

    // API tải lên tài liệu học tập mới
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a new academic document", description = "Uploads a document file (PDF, DOCX, etc.) to Firebase Storage, parses text context, and saves metadata in the database.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document uploaded successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid file or upload details provided", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Invalid file or upload details provided\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server or storage error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestPart("request") String requestJson) throws IOException {
        
        DocumentUploadRequest request;
        try {
            request = objectMapper.readValue(requestJson, DocumentUploadRequest.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON format in 'request' field");
        }
        
        if (request == null || request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.uploadDocument(file, request, email));
    }

    // API chuyển tài liệu vào một thư mục
    @PutMapping("/{id}/move")
    @Operation(summary = "Move document to folder", description = "Moves a document into a specified folder (or moves to root if folderId is empty).")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document moved successfully"),
        @ApiResponse(responseCode = "404", description = "Document or folder not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document or folder not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<DocumentResponse> moveDocument(
            @PathVariable Long id,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.moveDocument(id, folderId, email));
    }

    // API xem thông tin chi tiết của một tài liệu
    @GetMapping("/{id}")
    @Operation(summary = "Get document details", description = "Retrieves metadata and status details of a specific document by its ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Document details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<DocumentResponse> getDocumentDetails(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.getDocumentDetails(id, email));
    }

    // API lấy danh sách tài liệu cá nhân đã tải lên
    @GetMapping("/my")
    @Operation(summary = "Get current user's uploaded documents", description = "Retrieves all documents uploaded by the currently logged-in user.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "List of user documents retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<List<DocumentResponse>> getUserDocuments() {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.getUserDocuments(email));
    }

    // API xóa tài liệu
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document", description = "Deletes a document from the database and removes its file from Firebase Storage.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Document deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Document not found", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"Document not found\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"User is not logged in / Invalid access token\", \"timestamp\": \"2026-06-14T16:40:00\"}"))),
        @ApiResponse(responseCode = "500", description = "Internal server error", content = @Content(schema = @Schema(implementation = com.studyhub.common.ApiErrorResponse.class), examples = @ExampleObject(value = "{\"success\": false, \"message\": \"An error occurred, please try again\", \"timestamp\": \"2026-06-14T16:40:00\"}")))
    })
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        documentService.deleteDocument(id, email);
        return ResponseEntity.noContent().build();
    }
}

