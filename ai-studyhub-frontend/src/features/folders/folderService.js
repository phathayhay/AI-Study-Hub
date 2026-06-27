import { apiGet, apiPost, apiPut, apiDelete } from '../../services/api'

export function getRootFolders() {
  return apiGet('/folders')
}

export function getPublicFolders() {
  return apiGet('/folders/public')
}

export function getFolder(id) {
  return apiGet(`/folders/${id}`)
}

export function getPublicFolder(id) {
  return apiGet(`/folders/public/${id}`)
}

export function createFolder(folderName, parentFolderId) {
  return apiPost('/folders', { folderName, parentFolderId })
}

export function renameFolder(id, folderName) {
  return apiPut(`/folders/${id}`, { folderName })
}

export function moveFolder(id, folderName, parentFolderId) {
  return apiPut(`/folders/${id}`, { folderName, parentFolderId })
}

export function updateFolderVisibility(id, visibility) {
  return apiPut(`/folders/${id}/visibility?visibility=${visibility}`)
}

export function deleteFolder(id) {
  return apiDelete(`/folders/${id}`)
}
