import { apiPost } from './api'

/**
 * Upload user avatar
 * Uploads an avatar image to Firebase Storage, automatically cleans up the old one if it exists, and updates avatarUrl in the database.
 * Method: POST
 * Path: /api/users/avatar
 * @param {any} body - Request body
 */
export function uploadAvatar(body) {
  return apiPost(`/users/avatar`, body);
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
