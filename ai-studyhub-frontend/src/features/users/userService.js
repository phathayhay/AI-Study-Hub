import { apiPost } from '../../services/api'

export function uploadAvatar(file) {
  const form = new FormData()
  form.append('file', file)
  return apiPost('/users/avatar', form)
}
