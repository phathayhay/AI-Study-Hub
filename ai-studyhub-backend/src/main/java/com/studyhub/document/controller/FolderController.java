package com.studyhub.document.controller;

import com.studyhub.document.dto.FolderRequest;
import com.studyhub.document.dto.FolderResponse;
import com.studyhub.document.service.FolderService;
import com.studyhub.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
@Tag(name = "Folder Management", description = "Folder hierarchy management APIs")
public class FolderController {

    private final FolderService folderService;

    // API tạo thư mục mới
    @PostMapping
    @Operation(summary = "Create a new folder", description = "Creates a new folder for the currently authenticated user.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Folder created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid folder details provided"),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<FolderResponse> createFolder(@Valid @RequestBody FolderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.createFolder(request, email));
    }

    // API lấy danh sách thư mục cha (gốc)
    @GetMapping
    @Operation(summary = "Get root folders", description = "Retrieves all root-level folders belonging to the authenticated user.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "List of root folders retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<FolderResponse>> getRootFolders() {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.getRootFolders(email));
    }

    // API xem chi tiết thư mục và các thư mục con bên trong
    @GetMapping("/{id}")
    @Operation(summary = "Get folder details", description = "Retrieves details of a folder and its children by its unique folder ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Folder details retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Folder not found"),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<FolderResponse> getFolderDetails(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.getFolderDetails(id, email));
    }

    // API đổi tên thư mục
    @PutMapping("/{id}")
    @Operation(summary = "Rename an existing folder", description = "Renames a folder owned by the authenticated user.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Folder renamed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid folder details provided"),
        @ApiResponse(responseCode = "404", description = "Folder not found"),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<FolderResponse> renameFolder(
            @PathVariable Long id,
            @Valid @RequestBody FolderRequest request) {
        String email = SecurityUtils.getCurrentUserEmail();
        return ResponseEntity.ok(folderService.renameFolder(id, request, email));
    }

    // API xóa thư mục và các tài liệu bên trong
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a folder", description = "Deletes a folder and all its contents (cascade) by folder ID.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Folder deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Folder not found"),
        @ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        String email = SecurityUtils.getCurrentUserEmail();
        folderService.deleteFolder(id, email);
        return ResponseEntity.noContent().build();
    }
}

