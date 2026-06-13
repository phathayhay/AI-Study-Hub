package com.studyhub.user.controller;

import com.studyhub.common.ApiResponse;
import com.studyhub.security.SecurityUtils;
import com.studyhub.storage.service.FirebaseStorageService;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "User profile management APIs")
public class UserController {

    private final UserRepository userRepository;
    private final FirebaseStorageService firebaseStorageService;

    // API tải lên ảnh đại diện của người dùng
    @PostMapping(value = "/avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload user avatar", description = "Uploads an avatar image to Firebase Storage, automatically cleans up the old one if it exists, and updates avatarUrl in the database.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Avatar uploaded successfully, returns image CDN URL"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Uploaded file is empty or invalid"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "User is not logged in / Invalid access token"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error or Firebase storage failure")
    })
    public ResponseEntity<ApiResponse<String>> uploadAvatar(@RequestParam("file") MultipartFile file) {
        String email = SecurityUtils.getCurrentUserEmail();
        log.info("API: Uploading avatar for user {}", email);

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        try {
            // Xóa ảnh đại diện cũ trên Firebase Storage nếu có
            String oldAvatarUrl = user.getAvatarUrl();
            if (oldAvatarUrl != null && !oldAvatarUrl.isEmpty()) {
                firebaseStorageService.deleteFile(oldAvatarUrl);
            }

            // Tải ảnh đại diện mới lên Firebase Storage
            String newAvatarUrl = firebaseStorageService.uploadFile(file, "avatars");

            // Cập nhật đường dẫn ảnh mới vào Database
            user.setAvatarUrl(newAvatarUrl);
            userRepository.save(user);

            return ResponseEntity.ok(ApiResponse.ok("Avatar uploaded successfully", newAvatarUrl));
        } catch (IOException e) {
            log.error("Failed to upload avatar for user {}: {}", email, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Failed to upload avatar, please try again later."));
        }
    }
}


