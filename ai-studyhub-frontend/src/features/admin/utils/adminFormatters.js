export function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('vi-VN')
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function formatBytes(value = 0) {
  if (!value) return '0 MB'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = Number(value)
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`
}

export function getInitial(value = 'A') {
  return String(value).trim().charAt(0).toUpperCase() || 'A'
}

export function getDocumentName(doc = {}) {
  return doc.title || doc.fileName || 'Untitled'
}

export function formatTypeLabel(value, types = []) {
  return types.find(([type]) => type === value)?.[1] || String(value || 'All')
}

export function getRenderableCloudinaryImage(url) {
  const value = String(url || '').trim()
  if (!value.includes('/image/upload/')) return value
  if (value.includes('/image/upload/f_jpg,q_auto/')) return value
  if (value.includes('/image/upload/f_auto,q_auto/')) return value.replace('/image/upload/f_auto,q_auto/', '/image/upload/f_jpg,q_auto/')
  return value.replace('/image/upload/', '/image/upload/f_jpg,q_auto/')
}
