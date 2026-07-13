import { normalizeStatus } from './adminNormalizers'

export function matchesSearch(query, values) {
  const term = String(query || '').toLowerCase().trim()
  if (!term) return true
  return values.some((value) => String(value || '').toLowerCase().includes(term))
}

export function matchesStatus(selected, status) {
  return !selected || normalizeStatus(status) === selected
}

export function getStatusOptions(items, readStatus, defaults = []) {
  const options = new Set(defaults)
  items.forEach((item) => {
    const status = readStatus(item)
    if (status) options.add(normalizeStatus(status))
  })
  return [...options]
}

export function sortItems(items, sortValue, readers) {
  const [field, direction = 'asc'] = sortValue.split(':')
  const multiplier = direction === 'desc' ? -1 : 1
  return [...items].sort((left, right) => {
    if (field === 'date') return compareDate(readers.date(left), readers.date(right)) * multiplier
    if (field === 'status') return compareText(normalizeStatus(readers.status(left)), normalizeStatus(readers.status(right))) * multiplier
    return compareText(readers.name(left), readers.name(right)) * multiplier
  })
}

function compareText(left, right) {
  return String(left || '').localeCompare(String(right || ''), 'vi', { sensitivity: 'base' })
}

function compareDate(left, right) {
  const leftTime = left ? new Date(left).getTime() : 0
  const rightTime = right ? new Date(right).getTime() : 0
  return (Number.isNaN(leftTime) ? 0 : leftTime) - (Number.isNaN(rightTime) ? 0 : rightTime)
}

