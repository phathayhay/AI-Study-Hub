import { apiGet, apiPost, apiPut, uploadFileWithProgress } from './api'

/**
 * Get current user profile
 * Retrieves profile details of the currently authenticated user.
 * Method: GET
 * Path: /api/users/profile
 */
export function getUserProfile() {
  return apiGet(`/users/profile`);
}

/**
 * Update current user profile
 * Updates profile details of the currently authenticated user.
 * Method: PUT
 * Path: /api/users/profile
 * @param {any} body - Request body
 */
export function updateUserProfile(body) {
  return apiPut(`/users/profile`, body);
}

/**
 * Upload user avatar
 * Uploads an avatar image to Firebase Storage, automatically cleans up the old one if it exists, and updates avatarUrl in the database.
 * Method: POST
 * Path: /api/users/avatar
 * @param {File} file - File object to upload
 * @param {Function} onProgress - Progress callback function
 */
export function uploadAvatar(file, onProgress) {
  return uploadFileWithProgress(`/users/avatar`, file, onProgress);
}


/**
 * Submit student identity verification
 * Uploads a student card image to Cloudinary, registers/updates the student verification request, and sets the user's verification status to PENDING.
 * Method: POST
 * Path: /api/users/verify-student
 * @param {any} body - Request body
 */
export function verifyStudent(body) {
  return apiPost(`/users/verify-student`, body);
}

/**
 * Get current user notifications and unread count
 * Method: GET
 * Path: /api/users/notifications
 */
export function getNotifications() {
  return apiGet(`/users/notifications`);
}

/**
 * Mark one notification as read
 * Method: PATCH
 * Path: /api/users/notifications/{id}/read
 * @param {any} id - Path parameter
 */
export function markNotificationAsRead(id) {
  return apiPut(`/users/notifications/${id}/read`);
}

/**
 * Mark all notifications as read
 * Method: PATCH
 * Path: /api/users/notifications/read-all
 */
export function markAllNotificationsAsRead() {
  return apiPut(`/users/notifications/read-all`);
}
