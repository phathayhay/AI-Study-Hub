package com.studyhub.storage.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Slf4j
@Service
public class FirebaseStorageService {

    public String uploadFile(MultipartFile file, String folderPath) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
        String fullPath = folderPath + "/" + uniqueFilename;

        Bucket bucket = StorageClient.getInstance().bucket();
        if (bucket == null) {
            log.error("Firebase bucket not initialized");
            throw new IllegalStateException("Firebase storage bucket is not available");
        }

        bucket.create(fullPath, file.getBytes(), file.getContentType());
        log.info("Uploaded file to Firebase storage: {}", fullPath);

        String encodedPath = URLEncoder.encode(fullPath, StandardCharsets.UTF_8);
        return String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media",
                bucket.getName(), encodedPath);
    }

    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || !fileUrl.contains("/o/")) {
                return;
            }
            String pathPart = fileUrl.split("/o/")[1].split("\\?")[0];
            String filePath = java.net.URLDecoder.decode(pathPart, StandardCharsets.UTF_8);

            Bucket bucket = StorageClient.getInstance().bucket();
            Blob blob = bucket.get(filePath);
            if (blob != null) {
                blob.delete();
                log.info("Deleted file from Firebase storage: {}", filePath);
            }
        } catch (Exception e) {
            log.error("Failed to delete file from Firebase storage: {}", e.getMessage());
        }
    }
}
