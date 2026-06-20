import { apiDelete, apiGet, apiPost, apiPut } from './api'

/**
 * Update a comment
 * Edits the content of an existing comment. Only the author can perform this action.
 */
export function updateComment(commentId, body) {
  return apiPut(`/comments/${commentId}`, body);
}

/**
 * Delete a comment
 * Performs soft delete on a comment. Can be performed by author or document owner.
 */
export function deleteComment(commentId) {
  return apiDelete(`/comments/${commentId}`);
}

/**
 * Get document threaded comments
 * Retrieves a list of root-level comments with recursively populated child replies.
 */
export function getComments(documentId) {
  return apiGet(`/documents/${documentId}/comments`);
}

/**
 * Add a comment to a document
 * Creates a new comment (or reply to an existing parent comment) on the specified document.
 */
export function addComment(documentId, body) {
  return apiPost(`/documents/${documentId}/comments`, body);
}
