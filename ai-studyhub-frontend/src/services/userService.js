import { apiPost } from './api'

export function uploadAvatar(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost('/users/avatar', formData)
}

export function verifyStudent(file) {
  const formData = new FormData()
  formData.append('file', file)
  return apiPost('/users/verify-student', formData)
}
