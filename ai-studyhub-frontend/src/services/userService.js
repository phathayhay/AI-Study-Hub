import { apiPost } from './api'

/**
 * Submit student identity verification
 * Uploads a student card image to Cloudinary, registers/updates the student verification request, and sets the user's verification status to PENDING.
 */
export function verifyStudent(body) {
  return apiPost('/users/verify-student', body);
}

/**
 * Upload user avatar
 * Uploads an avatar image to Firebase Storage, automatically cleans up the old one if it exists, and updates avatarUrl in the database.
 */
export function uploadAvatar(body) {
  return apiPost('/users/avatar', body);
}
