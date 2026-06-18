import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api'

export function getMyDocuments() {
  return apiGet('/documents/my')
}

export function getSharedDocuments() {
  return apiGet('/documents/shared')
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
