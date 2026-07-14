export function AdminSortableTh({ children, defaultDirection = 'asc', field, onSort, sortBy }) {
  const [activeField, direction = 'asc'] = sortBy.split(':')
  const active = activeField === field
  const nextDirection = active && direction === 'asc' ? 'desc' : 'asc'
  const nextSort = active ? `${field}:${nextDirection}` : `${field}:${defaultDirection}`

  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button className={`admin-sort-header${active ? ' is-active' : ''}`} onClick={() => onSort(nextSort)} type="button">
        <span>{children}</span>
        <span aria-hidden="true" className="admin-sort-arrows">{active ? (direction === 'asc' ? '↑' : '↓') : '↑↓'}</span>
      </button>
    </th>
  )
}
