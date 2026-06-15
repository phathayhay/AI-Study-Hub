package com.studyhub.storage.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService {

    private final Cloudinary cloudinary;

    private boolean isImage(String contentType, String filename) {
        if (contentType != null && contentType.startsWith("image/")) {
            return true;
        }
        if (filename != null) {
            String lower = filename.toLowerCase();
            return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png") || lower.endsWith(".gif") || lower.endsWith(".bmp") || lower.endsWith(".webp");
        }
        return false;
    }

    public String uploadFile(MultipartFile file, String folderPath) throws IOException {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "file";
        }
        
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        }

        String cleanName = originalFilename.substring(0, dotIndex > 0 ? dotIndex : originalFilename.length())
                .replaceAll("[^a-zA-Z0-9_-]", "_");
        
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        
        boolean image = isImage(file.getContentType(), originalFilename);
        
        String publicId = folderPath + "/" + cleanName + "_" + uniqueId;
        String cloudinaryPublicId = image ? publicId : (publicId + extension);
        String resourceType = image ? "image" : "raw";

        log.info("Uploading file to Cloudinary: publicId={}, resourceType={}", cloudinaryPublicId, resourceType);

        Map<?, ?> params = ObjectUtils.asMap(
                "resource_type", resourceType,
                "public_id", cloudinaryPublicId
        );

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
        
        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Uploaded successfully to Cloudinary: {}", secureUrl);
        return secureUrl;
    }

    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || fileUrl.isEmpty()) {
                return;
            }

            String resourceType = null;
            String keyword = null;
            
            if (fileUrl.contains("/image/upload/")) {
                resourceType = "image";
                keyword = "/image/upload/";
            } else if (fileUrl.contains("/raw/upload/")) {
                resourceType = "raw";
                keyword = "/raw/upload/";
            } else {
                log.warn("URL does not contain standard Cloudinary upload path patterns: {}", fileUrl);
                return;
            }

            int index = fileUrl.indexOf(keyword);
            String pathAndPublicId = fileUrl.substring(index + keyword.length());
            String[] parts = pathAndPublicId.split("/", 2);
            if (parts.length < 2) {
                return;
            }
            
            String publicIdWithExt = parts[1];
            
            String finalPublicId;
            if ("image".equals(resourceType)) {
                int lastDotIndex = publicIdWithExt.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    finalPublicId = publicIdWithExt.substring(0, lastDotIndex);
                } else {
                    finalPublicId = publicIdWithExt;
                }
            } else {
                finalPublicId = publicIdWithExt;
            }

            log.info("Deleting from Cloudinary: resourceType={}, publicId={}", resourceType, finalPublicId);

            Map<?, ?> result = cloudinary.uploader().destroy(finalPublicId, ObjectUtils.asMap("resource_type", resourceType));
            log.info("Deleted from Cloudinary, result: {}", result);
        } catch (Exception e) {
            log.error("Failed to delete file from Cloudinary: {}", e.getMessage());
        }
    }
}
