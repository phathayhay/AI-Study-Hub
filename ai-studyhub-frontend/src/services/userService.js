import { apiPost } from './api'

export function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost('/api/users/avatar', formData)
}
