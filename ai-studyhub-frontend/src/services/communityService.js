import { apiDelete, apiGet, apiPost } from './api'

/**
 * Share document with user
 * Grants view/edit access permissions of an owned document to another user by email.
 */
export function shareDocument(id, body) {
  return apiPost(`/documents/${id}/share`, body);
}

/**
 * Report a document violation
 * Submits a violation report for the specified document (Spam, Inappropriate, Copyright, etc.).
 */
export function reportDocument(id, body) {
  return apiPost(`/documents/${id}/report`, body);
}

/**
 * Rate a document
 * Submits or updates a 1-to-5 star rating for the document. Re-calculates and updates average score.
 */
export function rateDocument(id, body) {
  return apiPost(`/documents/${id}/ratings`, body);
}

/**
 * Add document to favorites
 * Adds the specified document to the user's favorite/bookmark list.
 */
export function addFavorite(id) {
  return apiPost(`/documents/${id}/favorite`, {});
}

/**
 * Remove document from favorites
 * Removes the specified document from the user's favorite list.
 */
export function removeFavorite(id) {
  return apiDelete(`/documents/${id}/favorite`);
}

/**
 * Get documents shared with me
 * Retrieves a paginated list of documents shared with the currently logged-in user.
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
 */
export function getUserFavorites(page, size) {
  const query = new URLSearchParams();
  if (page !== undefined && page !== null) query.append('page', page);
  if (size !== undefined && size !== null) query.append('size', size);
  return apiGet(`/documents/favorites${query.toString() ? `?${query.toString()}` : ''}`);
}
