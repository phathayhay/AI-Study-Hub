import { apiGet, apiPost } from './api'

/**
 * Change password (Authenticated)
 * Updates password for currently authenticated user after validating their old password.
 * Method: POST
 * Path: /api/auth/change-password
 * @param {any} body - Request body
 */
export function changePassword(body) {
  return apiPost(`/auth/change-password`, body);
}

/**
 * Request password recovery link
 * Accepts user email and sends a password recovery email containing a reset link valid for 15 minutes.
 * Method: POST
 * Path: /api/auth/forgot-password
 * @param {any} body - Request body
 */
export function forgotPassword(body) {
  return apiPost(`/auth/forgot-password`, body);
}

/**
 * User login authentication
 * Validates user credentials and issues JWT Access Token and Refresh Token.
 * Method: POST
 * Path: /api/auth/login
 * @param {any} body - Request body
 */
export function login(body) {
  return apiPost(`/auth/login`, body);
}

/**
 * Logout user session
 * Revokes and deletes the active session refresh token from database.
 * Method: POST
 * Path: /api/auth/logout
 * @param {any} body - Request body
 */
export function logout(body) {
  return apiPost(`/auth/logout`, body);
}

/**
 * Refresh JWT Access Token
 * Accepts a valid refresh token and issues a new access token and rotated refresh token.
 * Method: POST
 * Path: /api/auth/refresh
 * @param {any} body - Request body
 */
export function refresh(body) {
  return apiPost(`/auth/refresh`, body);
}

/**
 * Register a new student account
 * Creates a new student account with default USER role and FREE subscription plan. Account is initially INACTIVE and requires email verification.
 * Method: POST
 * Path: /api/auth/register
 * @param {any} body - Request body
 */
export function register(body) {
  return apiPost(`/auth/register`, body);
}

/**
 * Reset password using recovery token
 * Accepts a recovery token and updates the account password.
 * Method: POST
 * Path: /api/auth/reset-password
 * @param {any} body - Request body
 */
export function resetPassword(body) {
  return apiPost(`/auth/reset-password`, body);
}

/**
 * Verify student email
 * Validates the verification token sent via email and activates the user account.
 * Method: GET
 * Path: /api/auth/verify-email
 * @param {any} token - Query parameter
 */
export function verifyEmail(token) {
  const query = new URLSearchParams();
  if (token !== undefined && token !== null) query.append('token', token);
  return apiGet(`/auth/verify-email${query.toString() ? `?${query.toString()}` : ''}`);
}
