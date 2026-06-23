import { apiGet, apiPost, apiPut, apiDelete } from './api'

/**
 * Create a new folder
 * Creates a new folder for the currently authenticated user.
 * Method: POST
 * Path: /api/folders
 * @param {any} body - Request body
 */
export function createFolder(body) {
  return apiPost(`/folders`, body);
}

/**
 * Delete a folder
 * Deletes a folder and all its contents (cascade) by folder ID.
 * Method: DELETE
 * Path: /api/folders/{id}
 * @param {any} id - Path parameter
 */
export function deleteFolder(id) {
  return apiDelete(`/folders/${id}`);
}

/**
 * Get folder details
 * Retrieves details of a folder and its children by its unique folder ID.
 * Method: GET
 * Path: /api/folders/{id}
 * @param {any} id - Path parameter
 */
export function getFolderDetails(id) {
  return apiGet(`/folders/${id}`);
}

/**
 * Get root folders
 * Retrieves all root-level folders belonging to the authenticated user.
 * Method: GET
 * Path: /api/folders
 */
export function getRootFolders() {
  return apiGet(`/folders`);
}

/**
 * Rename an existing folder
 * Renames a folder owned by the authenticated user.
 * Method: PUT
 * Path: /api/folders/{id}
 * @param {any} id - Path parameter
 * @param {any} body - Request body
 */
export function renameFolder(id, body) {
  return apiPut(`/folders/${id}`, body);
}
