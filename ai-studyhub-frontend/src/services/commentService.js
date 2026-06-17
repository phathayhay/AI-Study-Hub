import { apiDelete, apiGet, apiPost, apiPut } from './api'

export function getDocumentComments(documentId) {
  return apiGet(`/api/documents/${documentId}/comments`)
}

export function addDocumentComment(documentId, content, parentCommentId = null) {
  return apiPost(`/api/documents/${documentId}/comments`, {
    content,
    parentCommentId: parentCommentId ?? undefined,
  })
}

export function updateComment(commentId, content, parentCommentId = null) {
  return apiPut(`/api/comments/${commentId}`, {
    content,
    parentCommentId: parentCommentId ?? undefined,
  })
}

export function deleteComment(commentId) {
  return apiDelete(`/api/comments/${commentId}`)
}
