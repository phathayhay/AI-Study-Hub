import { apiPost } from './api'

export function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost('/api/users/avatar', formData)
}

export function verifyStudent(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost('/api/users/verify-student', formData)
}
