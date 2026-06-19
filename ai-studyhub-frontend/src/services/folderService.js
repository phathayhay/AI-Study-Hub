import { apiDelete, apiGet, apiPost, apiPut } from './api'

export function createFolder(folderName, parentFolderId = null) {
  return apiPost('/api/folders', { folderName, parentFolderId })
}

export function getRootFolders() {
  return apiGet('/api/folders')
}

export function getFolderDetails(folderId) {
  return apiGet(`/api/folders/${folderId}`)
}

export function renameFolder(folderId, folderName, parentFolderId = null) {
  return apiPut(`/api/folders/${folderId}`, { folderName, parentFolderId })
}

export function deleteFolder(folderId) {
  return apiDelete(`/api/folders/${folderId}`)
}
