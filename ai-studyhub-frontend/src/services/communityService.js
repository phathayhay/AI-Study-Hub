import { apiGet, apiPost, apiDelete } from './api'

/**
 * Add document to favorites
 * Adds the specified document to the user's favorite/bookmark list.
 * Method: POST
 * Path: /api/documents/{id}/favorite
 * @param {any} id - Path parameter
 */
export function addFavorite(id) {
  return apiPost(`/documents/${id}/favorite`);
}

/**
 * Get documents shared with me
 * Retrieves a paginated list of documents shared with the currently logged-in user.
 * Method: GET
 * Path: /api/documents/shared
 * @param {any} page - Query parameter
 * @param {any} size - Query parameter
 */
export function getSharedDocuments(page, size) {
  const query = new URLSearchParams();
  if (page !== undefined && page !== null) query.append('page', page);
  if (size !== undefined && size !== null) query.append('size', size);
  return apiGet(`/documents/shared${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Get user's favorite documents
 * Retrieves a paginated list of documents favorited by the logged-in user.
 * Method: GET
 * Path: /api/documents/favorites
 * @param {any} page - Query parameter
 * @param {any} size - Query parameter
 */
export function getUserFavorites(page = 0, size = 1000) {
  const query = new URLSearchParams();
  if (page !== undefined && page !== null) query.append('page', page);
  if (size !== undefined && size !== null) query.append('size', size);
  return apiGet(`/documents/favorites${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Rate a document
 * Submits or updates a 1-to-5 star rating for the document. Re-calculates and updates average score.
 * Method: POST
 * Path: /api/documents/{id}/ratings
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function rateDocument(id, body) {
  return apiPost(`/documents/${id}/ratings`, body);
}

/**
 * Remove document from favorites
 * Removes the specified document from the user's favorite list.
 * Method: DELETE
 * Path: /api/documents/{id}/favorite
 * @param {any} id - Path parameter
 */
export function removeFavorite(id) {
  return apiDelete(`/documents/${id}/favorite`);
}

/**
 * Report a document violation
 * Submits a violation report for the specified document (Spam, Inappropriate, Copyright, etc.).
 * Method: POST
 * Path: /api/documents/{id}/report
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function reportDocument(id, body) {
  return apiPost(`/documents/${id}/report`, body);
}

/**
 * Share document with user
 * Grants view/edit access permissions of an owned document to another user by email.
 * Method: POST
 * Path: /api/documents/{id}/share
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function shareDocument(id, body) {
  return apiPost(`/documents/${id}/share`, body);
}
