package com.studyhub.document.controller;

import com.studyhub.document.dto.FolderRequest;
import com.studyhub.document.dto.FolderResponse;
import com.studyhub.document.service.FolderService;
import com.studyhub.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
public class FolderController {

    private final FolderService folderService;

    @PostMapping
    public ResponseEntity<FolderResponse> createFolder(@Valid @RequestBody FolderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.createFolder(request, email));
    }

    @GetMapping
    public ResponseEntity<List<FolderResponse>> getRootFolders() {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.getRootFolders(email));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FolderResponse> getFolderDetails(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.getFolderDetails(id, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FolderResponse> renameFolder(
            @PathVariable Long id,
            @Valid @RequestBody FolderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.renameFolder(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        folderService.deleteFolder(id, email);
        return ResponseEntity.noContent().build();
    }
}
