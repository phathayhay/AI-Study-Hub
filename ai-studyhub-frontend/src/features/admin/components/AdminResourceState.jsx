export function AdminResourceState({ error, loading, onRetry }) {
  if (loading) return <p className="admin-empty">Loading admin data...</p>
  if (error) {
    return (
      <div className="admin-empty">
        <p>{error}</p>
        {onRetry && <button onClick={onRetry} type="button">Retry</button>}
      </div>
    )
  }
  return null
}

export function AdminNoResults({ colSpan }) {
  return <tr><td className="admin-table-empty" colSpan={colSpan}>No matching records</td></tr>
}

