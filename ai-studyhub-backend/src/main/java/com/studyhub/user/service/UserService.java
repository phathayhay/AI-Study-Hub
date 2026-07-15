package com.studyhub.user.service;

import com.studyhub.user.dto.UpdateProfileRequest;
import com.studyhub.user.dto.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface UserService {
    /**
     * Upload user avatar to Cloudinary, clean up old avatar, and update user database.
     *
     * @param email user email
     * @param file  uploaded avatar file
     * @return the new avatar URL
     * @throws IOException if network or file processing error occurs
     */
    String uploadAvatar(String email, MultipartFile file) throws IOException;

    /**
     * Retrieve the user's detailed profile response including storage quotas and verification state.
     *
     * @param email user email
     * @return UserProfileResponse
     */
    UserProfileResponse getProfile(String email);

    /**
     * Update user profile information.
     *
     * @param email   user email
     * @param request profile update parameters
     * @return the updated UserProfileResponse
     */
    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);
}
