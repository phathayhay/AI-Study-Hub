import { apiDelete, apiGet, apiPost, apiPut } from './api'

export function uploadDocument(file, metadata) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', metadata.title)

  for (const field of ['description', 'courseId', 'categoryId', 'folderId', 'visibility']) {
    const value = metadata[field]
    if (value !== undefined && value !== null && value !== '') formData.append(field, value)
  }
  for (const tag of metadata.tags ?? []) {
    if (tag.trim()) formData.append('tags', tag.trim())
  }

  return apiPost('/api/documents/upload', formData)
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

export function deleteDocument(documentId) {
  return apiDelete(`/api/documents/${documentId}`)
}
