package com.studyhub.user.service;

import com.studyhub.common.enums.VerificationStatus;
import com.studyhub.storage.service.CloudinaryStorageService;
import com.studyhub.user.entity.StudentVerification;
import com.studyhub.user.entity.User;
import com.studyhub.user.repository.StudentVerificationRepository;
import com.studyhub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentVerificationService {

    private final StudentVerificationRepository studentVerificationRepository;
    private final UserRepository userRepository;
    private final CloudinaryStorageService cloudinaryStorageService;

    /**
     * Tải lên ảnh thẻ sinh viên để gửi yêu cầu xác thực.
     * Nếu đã có yêu cầu bị từ chối hoặc đang chờ duyệt trước đó, sẽ ghi đè và cập nhật lại trạng thái thành PENDING.
     */
    @Transactional
    public void uploadVerificationCard(MultipartFile file, String email) throws IOException {
        log.info("Processing student verification upload for user: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với email đã cung cấp"));

        if (user.getVerificationStatus() == VerificationStatus.APPROVED) {
            throw new IllegalStateException("Tài khoản sinh viên của bạn đã được xác thực trước đó.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File tải lên không được để trống");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ chấp nhận các file định dạng hình ảnh");
        }

        // Tìm xem đã có bản ghi xác thực nào trước đây chưa
        StudentVerification verification = studentVerificationRepository.findByUserId(user.getId())
                .orElse(null);

        if (verification != null) {
            // Nếu có ảnh cũ, xóa đi để tránh rác trên Cloudinary
            String oldImageUrl = verification.getImageUrl();
            if (oldImageUrl != null && !oldImageUrl.isEmpty()) {
                log.info("Deleting old verification image: {}", oldImageUrl);
                cloudinaryStorageService.deleteFile(oldImageUrl);
            }
        } else {
            // Tạo mới nếu chưa từng gửi yêu cầu
            verification = StudentVerification.builder()
                    .user(user)
                    .build();
        }

        // Tải ảnh mới lên Cloudinary
        String newImageUrl = cloudinaryStorageService.uploadFile(file, "student_verifications");

        // Cập nhật thông tin yêu cầu xác thực
        verification.setImageUrl(newImageUrl);
        verification.setStatus(VerificationStatus.PENDING);
        verification.setReviewNote(null);
        verification.setReviewedBy(null);
        verification.setReviewedAt(null);

        studentVerificationRepository.save(verification);

        // Cập nhật trạng thái xác thực của User
        user.setVerificationStatus(VerificationStatus.PENDING);
        userRepository.save(user);

        log.info("Student verification request submitted successfully for user: {}", email);
    }
}
