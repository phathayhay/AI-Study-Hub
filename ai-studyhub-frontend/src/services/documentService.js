import { apiDelete, apiGet, apiPost, apiPut } from './api'

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

export function addDocumentFavorite(documentId) {
  return apiPost(`/api/documents/${documentId}/favorite`, {})
}

export function removeDocumentFavorite(documentId) {
  return apiDelete(`/api/documents/${documentId}/favorite`)
}

export function publishDocument(documentId) {
  return apiPut(`/api/documents/${documentId}/publish`)
}

export function deleteDocument(documentId) {
  return apiDelete(`/api/documents/${documentId}`)
}
