package com.studyhub.document.controller;

import com.studyhub.document.dto.DocumentResponse;
import com.studyhub.document.dto.DocumentUploadRequest;
import com.studyhub.document.service.DocumentService;
import com.studyhub.security.SecurityUtils;
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
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute DocumentUploadRequest request) throws IOException {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.uploadDocument(file, request, email));
    }

    @PutMapping("/{id}/move")
    public ResponseEntity<DocumentResponse> moveDocument(
            @PathVariable Long id,
            @RequestParam(value = "folderId", required = false) Long folderId) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.moveDocument(id, folderId, email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocumentDetails(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.getDocumentDetails(id, email));
    }

    @GetMapping("/my")
    public ResponseEntity<List<DocumentResponse>> getUserDocuments() {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(documentService.getUserDocuments(email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        documentService.deleteDocument(id, email);
        return ResponseEntity.noContent().build();
    }
}
