import { apiDelete, apiGet, apiPost, apiPut, buildQueryString } from './api'

export function uploadDocument(file, metadata) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append(
    'request',
    new Blob([JSON.stringify(buildUploadRequest(metadata))], { type: 'application/json' }),
  )

  return apiPost('/api/documents/upload', formData)
}

function buildUploadRequest(metadata) {
  const request = {
    title: metadata.title.trim(),
    description: metadata.description?.trim() || null,
    visibility: metadata.visibility || 'PRIVATE',
    tags: (metadata.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
  }

  if (metadata.courseCode?.trim()) request.courseCode = metadata.courseCode.trim()
  if (metadata.categoryName?.trim()) request.categoryName = metadata.categoryName.trim()

  for (const field of ['courseId', 'categoryId', 'folderId']) {
    if (metadata[field] !== undefined && metadata[field] !== null && metadata[field] !== '') {
      request[field] = Number(metadata[field])
    }
  }

  return request
}

export function moveDocument(documentId, folderId = null) {
  const query = folderId === null ? '' : `?folderId=${encodeURIComponent(folderId)}`
  return apiPut(`/api/documents/${documentId}/move${query}`)
}

export function getDocumentDetails(documentId) {
  return apiGet(`/api/documents/${documentId}`)
}

export function getMyDocuments() {
  return apiGet('/api/documents/my')
}

export function getFavoriteDocuments() {
  return apiGet('/api/documents/favorites')
}

export function getSharedDocuments(params = {}) {
  return apiGet(`/api/documents/shared${buildQueryString({
    page: params.page,
    size: params.size,
  })}`)
}

export function getViewHistory(params = {}) {
  return apiGet(`/api/documents/history${buildQueryString({
    page: params.page,
    size: params.size,
  })}`)
}

export function searchDocuments(params = {}) {
  return apiGet(`/api/documents/search${buildQueryString({
    keyword: params.keyword,
    majorId: params.majorId,
    courseId: params.courseId,
    categoryId: params.categoryId,
    page: params.page,
    size: params.size,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })}`)
}

export function downloadDocument(documentId) {
  return apiGet(`/api/documents/${documentId}/download`)
}

export function addDocumentFavorite(documentId) {
  return apiPost(`/api/documents/${documentId}/favorite`, {})
}

export function removeDocumentFavorite(documentId) {
  return apiDelete(`/api/documents/${documentId}/favorite`)
}

export function shareDocument(documentId, sharedUserEmail, permission = 'VIEW') {
  return apiPost(`/api/documents/${documentId}/share`, { sharedUserEmail, permission })
}

export function reportDocument(documentId, reportType, reportReason) {
  return apiPost(`/api/documents/${documentId}/report`, { reportType, reportReason })
}

export function rateDocument(documentId, rating) {
  return apiPost(`/api/documents/${documentId}/ratings`, { rating: Number(rating) })
}

export function publishDocument(documentId) {
  return apiPut(`/api/documents/${documentId}/publish`)
}

export function updateDocumentVisibility(documentId, visibility) {
  return apiPut(`/api/documents/${documentId}/visibility?visibility=${encodeURIComponent(visibility)}`)
}

export function deleteDocument(documentId) {
  return apiDelete(`/api/documents/${documentId}`)
}
