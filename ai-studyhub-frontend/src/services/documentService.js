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

export function deleteDocument(documentId) {
  return apiDelete(`/api/documents/${documentId}`)
}
