import { apiDelete, apiGet, apiPost, apiPut } from './api'

export function uploadDocument(file, metadata) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', metadata.title)

  const optionalFields = ['description', 'courseId', 'categoryId', 'folderId', 'visibility']
  optionalFields.forEach((field) => {
    const value = metadata[field]
    if (value !== undefined && value !== null && value !== '') {
      formData.append(field, value)
    }
  })

  ;(metadata.tags ?? []).forEach((tag) => {
    const trimmedTag = tag.trim()
    if (trimmedTag) formData.append('tags', trimmedTag)
  })

  return apiPost('/api/documents/upload', formData)
}

export function moveDocument(documentId, folderId = null) {
  const query = folderId === null || folderId === undefined
    ? ''
    : `?folderId=${encodeURIComponent(folderId)}`

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
