import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api'

export function getMyDocuments() {
  return apiGet('/documents/my')
}

export function getSharedDocuments() {
  return apiGet('/documents/shared')
}

export function searchDocuments(params = {}) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val)
    }
  })
  const queryString = query.toString()
  return apiGet(`/documents/search${queryString ? `?${queryString}` : ''}`)
}

export function getDocument(id) {
  return apiGet(`/documents/${id}`)
}

export function deleteDocument(id) {
  return apiDelete(`/documents/${id}`)
}

export function moveDocument(id, folderId) {
  const params = folderId ? `?folderId=${folderId}` : ''
  return apiPut(`/documents/${id}/move${params}`)
}

export function uploadDocument(file, metadata) {
  const form = new FormData()
  form.append('file', file)
  form.append('request', JSON.stringify(metadata))
  return apiPost('/documents/upload', form)
}

export function getFavoriteDocuments() {
  return apiGet('/documents/favorites')
}

export function getHistoryDocuments() {
  return apiGet('/documents/history')
}

export function favoriteDocument(id) {
  return apiPost(`/documents/${id}/favorite`)
}

export function unfavoriteDocument(id) {
  return apiDelete(`/documents/${id}/favorite`)
}

export function rateDocument(id, rating) {
  return apiPost(`/documents/${id}/ratings`, { rating })
}

export function getDocumentComments(documentId) {
  return apiGet(`/documents/${documentId}/comments`)
}

export function addDocumentComment(documentId, content, parentCommentId = null) {
  return apiPost(`/documents/${documentId}/comments`, { content, parentCommentId })
}

export function reportDocument(id, reportType, reportReason) {
  return apiPost(`/documents/${id}/report`, { reportType, reportReason })
}

export function shareDocument(id, sharedUserEmail, permission = 'VIEW') {
  return apiPost(`/documents/${id}/share`, { sharedUserEmail, permission })
}

export function updateDocumentVisibility(id, visibility) {
  return apiPut(`/documents/${id}/visibility?visibility=${visibility}`)
}
