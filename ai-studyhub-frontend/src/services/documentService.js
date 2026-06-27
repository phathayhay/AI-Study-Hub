import { apiGet, apiPost, apiPut, apiDelete } from './api'

/**
 * Delete a document
 * Deletes a document from the database and removes its file from Firebase Storage.
 * Method: DELETE
 * Path: /api/documents/{id}
 * @param {any} id - Path parameter
 */
export function deleteDocument(id) {
  return apiDelete(`/documents/${id}`);
}

/**
 * Download a document (Authenticated)
 * Registers a download event, increments the download counter, and returns the document metadata containing the download URL. Requires authentication.
 * Method: GET
 * Path: /api/documents/{id}/download
 * @param {any} id - Path parameter
 */
export function downloadDocument(id) {
  return apiGet(`/documents/${id}/download`);
}

/**
 * Get document details
 * Retrieves metadata and status details of a specific document by its ID. Can be accessed anonymously if document is public.
 * Method: GET
 * Path: /api/documents/{id}
 * @param {any} id - Path parameter
 */
export function getDocumentDetails(id) {
  return apiGet(`/documents/${id}`);
}

/**
 * Get current user's uploaded documents
 * Retrieves all documents uploaded by the currently logged-in user.
 * Method: GET
 * Path: /api/documents/my
 */
export function getUserDocuments() {
  return apiGet(`/documents/my`);
}

/**
 * Get user document view history
 * Retrieves distinct recently viewed documents for the currently logged-in user.
 * Method: GET
 * Path: /api/documents/history
 * @param {any} page - Query parameter
 * @param {any} size - Query parameter
 */
export function getViewHistory(page, size) {
  const query = new URLSearchParams();
  if (page !== undefined && page !== null) query.append('page', page);
  if (size !== undefined && size !== null) query.append('size', size);
  return apiGet(`/documents/history${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Move document to folder
 * Moves a document into a specified folder (or moves to root if folderId is empty).
 * Method: PUT
 * Path: /api/documents/{id}/move
 * @param {any} id - Path parameter
 * @param {any} folderId - Query parameter
 */
export function moveDocument(id, folderId) {
  const query = new URLSearchParams();
  if (folderId !== undefined && folderId !== null) query.append('folderId', folderId);
  return apiPut(`/documents/${id}/move${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Search and filter public documents
 * Searches for public documents by keyword (matches title or description) and filters by major, course, or category. Supports sorting and pagination.
 * Method: GET
 * Path: /api/documents/search
 * @param {any} keyword - Query parameter
 * @param {any} majorId - Query parameter
 * @param {any} courseId - Query parameter
 * @param {any} categoryId - Query parameter
 * @param {any} page - Query parameter
 * @param {any} size - Query parameter
 * @param {any} sortBy - Query parameter
 * @param {any} sortDir - Query parameter
 */
export function searchDocuments(keyword, majorId, courseId, categoryId, page, size, sortBy, sortDir) {
  const query = new URLSearchParams();
  if (keyword !== undefined && keyword !== null) query.append('keyword', keyword);
  if (majorId !== undefined && majorId !== null) query.append('majorId', majorId);
  if (courseId !== undefined && courseId !== null) query.append('courseId', courseId);
  if (categoryId !== undefined && categoryId !== null) query.append('categoryId', categoryId);
  if (page !== undefined && page !== null) query.append('page', page);
  if (size !== undefined && size !== null) query.append('size', size);
  if (sortBy !== undefined && sortBy !== null) query.append('sortBy', sortBy);
  if (sortDir !== undefined && sortDir !== null) query.append('sortDir', sortDir);
  return apiGet(`/documents/search${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Update document visibility
 * Updates the visibility status (PUBLIC/PRIVATE) of a document. Only the owner can perform this action.
 * Method: PUT
 * Path: /api/documents/{id}/visibility
 * @param {any} id - Path parameter
 * @param {any} visibility - Query parameter
 */
export function updateVisibility(id, visibility) {
  const query = new URLSearchParams();
  if (visibility !== undefined && visibility !== null) query.append('visibility', visibility);
  return apiPut(`/documents/${id}/visibility${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Upload a new academic document
 * Uploads a document file (PDF, DOCX, etc.) to Firebase Storage, parses text context, and saves metadata in the database.
 * Method: POST
 * Path: /api/documents/upload
 * @param {any} body - Request body
 */
export function uploadDocument(file, metadata) {
  const form = new FormData();
  form.append('file', file);
  form.append('request', JSON.stringify(metadata));
  return apiPost(`/documents/upload`, form);
}
