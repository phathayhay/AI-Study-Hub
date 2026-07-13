export function AdminPagination({ currentPage, last, onPageChange, totalElements, totalPages }) {
  if (!totalElements) return null
  return (
    <div className="admin-pagination">
      <small>{totalElements} logs</small>
      <div className="admin-pagination-controls">
        <button disabled={currentPage <= 0} onClick={() => onPageChange(Math.max(0, currentPage - 1))} type="button">Previous</button>
        <span>Page {currentPage + 1} / {Math.max(totalPages, 1)}</span>
        <button disabled={last} onClick={() => onPageChange(currentPage + 1)} type="button">Next</button>
      </div>
    </div>
  )
}

