import { apiGet, apiPost, apiPut, apiDelete } from './api'

/**
 * Ban user account
 * Bans a user account by setting their status to BANNED.
 * Method: POST
 * Path: /api/admin/users/{id}/ban
 * @param {any} id - Path parameter
 */
export function banUser(id) {
  return apiPost(`/admin/users/${id}/ban`);
}

/**
 * Create document category
 * Adds a new category name.
 * Method: POST
 * Path: /api/admin/categories
 * @param {any} body - Request body
 */
export function createCategory(body) {
  return apiPost(`/admin/categories`, body);
}

/**
 * Create course config
 * Adds a new course configuration linked to a Major.
 * Method: POST
 * Path: /api/admin/courses
 * @param {any} body - Request body
 */
export function createCourse(body) {
  return apiPost(`/admin/courses`, body);
}

/**
 * Create major config
 * Adds a new major config to the system.
 * Method: POST
 * Path: /api/admin/majors
 * @param {any} body - Request body
 */
export function createMajor(body) {
  return apiPost(`/admin/majors`, body);
}

/**
 * Create plan config
 * Adds a new subscription plan with specific limits and price.
 * Method: POST
 * Path: /api/admin/plans
 * @param {any} body - Request body
 */
export function createPlan(body) {
  return apiPost(`/admin/plans`, body);
}

/**
 * Delete document category
 * Deletes a document category by ID.
 * Method: DELETE
 * Path: /api/admin/categories/{id}
 * @param {any} id - Path parameter
 */
export function deleteCategory(id) {
  return apiDelete(`/admin/categories/${id}`);
}

/**
 * Delete course config
 * Deletes a course config by ID.
 * Method: DELETE
 * Path: /api/admin/courses/{id}
 * @param {any} id - Path parameter
 */
export function deleteCourse(id) {
  return apiDelete(`/admin/courses/${id}`);
}

/**
 * Delete major config
 * Deletes major configuration from the system.
 * Method: DELETE
 * Path: /api/admin/majors/{id}
 * @param {any} id - Path parameter
 */
export function deleteMajor(id) {
  return apiDelete(`/admin/majors/${id}`);
}

/**
 * Delete plan config
 * Deletes plan configuration by ID.
 * Method: DELETE
 * Path: /api/admin/plans/{id}
 * @param {any} id - Path parameter
 */
export function deletePlan(id) {
  return apiDelete(`/admin/plans/${id}`);
}

/**
 * List all document categories
 * Retrieves all document categories.
 * Method: GET
 * Path: /api/admin/categories
 */
export function getAllCategories() {
  return apiGet(`/admin/categories`);
}

/**
 * List all courses config
 * Retrieves all course configurations in the system.
 * Method: GET
 * Path: /api/admin/courses
 */
export function getAllCourses() {
  return apiGet(`/admin/courses`);
}

/**
 * Get all documents
 * Retrieves all documents uploaded in the system for administrative audit.
 * Method: GET
 * Path: /api/admin/documents
 */
export function getAllDocuments() {
  return apiGet(`/admin/documents`);
}

/**
 * List all majors config
 * Retrieves all major configurations in the system.
 * Method: GET
 * Path: /api/admin/majors
 */
export function getAllMajors() {
  return apiGet(`/admin/majors`);
}

/**
 * List all plans config
 * Retrieves all subscription plans configs in the system.
 * Method: GET
 * Path: /api/admin/plans
 */
export function getAllPlans() {
  return apiGet(`/admin/plans`);
}

/**
 * Get all reports
 * Retrieves all content violation reports submitted by users.
 * Method: GET
 * Path: /api/admin/reports
 */
export function getAllReports() {
  return apiGet(`/admin/reports`);
}

/**
 * Get all users list
 * Retrieves a list of all users registered in the system.
 * Method: GET
 * Path: /api/admin/users
 */
export function getAllUsers() {
  return apiGet(`/admin/users`);
}

/**
 * Get pending verifications
 * Retrieves all pending student verifications for review.
 * Method: GET
 * Path: /api/admin/verifications/pending
 */
export function getPendingVerifications() {
  return apiGet(`/admin/verifications/pending`);
}

/**
 * Moderate uploaded document
 * Approves or rejects a document to control visibility in the community feed.
 * Method: POST
 * Path: /api/admin/documents/{id}/moderate
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function moderateDocument(id, body) {
  return apiPost(`/admin/documents/${id}/moderate`, body);
}

/**
 * Resolve violation report
 * Resolves a user report and optionally rejects/bans the reported document.
 * Method: POST
 * Path: /api/admin/reports/{id}/resolve
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function resolveReport(id, body) {
  return apiPost(`/admin/reports/${id}/resolve`, body);
}

/**
 * Review student identity verification card
 * Approves or rejects a student identity card verification request.
 * Method: POST
 * Path: /api/admin/verifications/{id}/review
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function reviewVerification(id, body) {
  return apiPost(`/admin/verifications/${id}/review`, body);
}

/**
 * Unban user account
 * Unbans a user account by restoring their status to ACTIVE.
 * Method: POST
 * Path: /api/admin/users/{id}/unban
 * @param {any} id - Path parameter
 */
export function unbanUser(id) {
  return apiPost(`/admin/users/${id}/unban`);
}

/**
 * Update document category
 * Updates category name by ID.
 * Method: PUT
 * Path: /api/admin/categories/{id}
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function updateCategory(id, body) {
  return apiPut(`/admin/categories/${id}`, body);
}

/**
 * Update course config
 * Updates course properties by ID.
 * Method: PUT
 * Path: /api/admin/courses/{id}
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function updateCourse(id, body) {
  return apiPut(`/admin/courses/${id}`, body);
}

/**
 * Update major config
 * Updates major properties by ID.
 * Method: PUT
 * Path: /api/admin/majors/{id}
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function updateMajor(id, body) {
  return apiPut(`/admin/majors/${id}`, body);
}

/**
 * Update plan config
 * Updates subscription plan limits and prices by ID.
 * Method: PUT
 * Path: /api/admin/plans/{id}
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function updatePlan(id, body) {
  return apiPut(`/admin/plans/${id}`, body);
}
