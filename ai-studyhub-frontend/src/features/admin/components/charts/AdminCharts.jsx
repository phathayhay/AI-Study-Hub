export function AdminChart({ title, type, data = [], secondaryData = [], summary, primaryLabel, secondaryLabel }) {
  const normalizedData = type === 'curve' ? compressHourlyUsage(data) : data
  const hasData = normalizedData.length > 0 && normalizedData.some((item) => Number(item?.value || 0) > 0)
  const hasSecondary = secondaryData.length > 0 && secondaryData.some((item) => Number(item?.value || 0) > 0)

  return (
    <section className={`admin-card admin-chart admin-chart--${type}`}>
      <h2>{title}</h2>
      {type === 'pie' ? (
        hasData ? <AdminPieChart data={normalizedData} /> : <p className="admin-empty">No chart data yet.</p>
      ) : type === 'dual-bars' ? (
        hasData || hasSecondary ? (
          <AdminDualBarChart
            data={normalizedData}
            primaryLabel={primaryLabel}
            secondaryData={secondaryData}
            secondaryLabel={secondaryLabel}
          />
        ) : (
          <p className="admin-empty">No chart data yet.</p>
        )
      ) : hasData ? (
        <AdminBarChart data={normalizedData} tone={type === 'curve' ? 'teal' : type === 'bars' ? 'purple' : 'blue'} />
      ) : (
        <p className="admin-empty">No chart data yet.</p>
      )}
      <small>{summary || (type === 'pie' ? 'Courses and categories' : 'Live admin summary')}</small>
    </section>
  )
}

function AdminBarChart({ data, tone = 'blue' }) {
  const maxValue = Math.max(...data.map((item) => Number(item?.value || 0)), 1)
  return (
    <div className={`fake-chart fake-chart--${tone}`}>
      {data.map((item, index) => {
        const value = Number(item?.value || 0)
        const showLabel = data.length <= 8 || index % Math.ceil(data.length / 8) === 0 || index === data.length - 1
        return (
        <div className="fake-chart-group" key={item.label}>
          <span
            className={`fake-chart-bar${value === 0 ? ' is-zero' : ''}`}
            style={{ height: `${value === 0 ? 0 : Math.max(10, (value / maxValue) * 100)}%` }}
          />
          <strong>{Number(item?.value || 0)}</strong>
          <small>{showLabel ? item.label : ''}</small>
        </div>
      )})}
    </div>
  )
}

function compressHourlyUsage(data) {
  if (!Array.isArray(data) || data.length <= 8) return data
  const groups = []
  for (let index = 0; index < data.length; index += 4) {
    const slice = data.slice(index, index + 4)
    const firstLabel = slice[0]?.label || ''
    const lastLabel = slice[slice.length - 1]?.label || ''
    const compactFirst = firstLabel.slice(0, 2)
    const compactLast = lastLabel.slice(0, 2)
    groups.push({
      label: `${compactFirst}-${compactLast}`,
      value: slice.reduce((sum, item) => sum + Number(item?.value || 0), 0),
    })
  }
  return groups
}

function AdminDualBarChart({ data, primaryLabel, secondaryData, secondaryLabel }) {
  const labels = [...new Set([...data.map((item) => item.label), ...secondaryData.map((item) => item.label)])]
  const primaryMap = new Map(data.map((item) => [item.label, Number(item?.value || 0)]))
  const secondaryMap = new Map(secondaryData.map((item) => [item.label, Number(item?.value || 0)]))
  const merged = labels.map((label) => ({
    label,
    primary: primaryMap.get(label) || 0,
    secondary: secondaryMap.get(label) || 0,
  }))
  const maxValue = Math.max(
    ...merged.flatMap((item) => [item.primary, item.secondary]),
    1,
  )

  return (
    <>
      <div className="admin-chart-legend">
        <span><i className="legend-swatch legend-swatch--blue" /> {primaryLabel || 'Primary'}</span>
        <span><i className="legend-swatch legend-swatch--teal" /> {secondaryLabel || 'Secondary'}</span>
      </div>
      <div className="fake-chart fake-chart--dual">
        {merged.map((item, index) => {
          const showLabel = merged.length <= 8 || index % Math.ceil(merged.length / 8) === 0 || index === merged.length - 1
          return (
          <div className="fake-chart-group fake-chart-group--dual" key={item.label}>
            <div className="fake-chart-pair">
              <span
                className={`fake-chart-bar fake-chart-bar--blue${item.primary === 0 ? ' is-zero' : ''}`}
                style={{ height: `${item.primary === 0 ? 0 : Math.max(10, (item.primary / maxValue) * 100)}%` }}
              />
              <span
                className={`fake-chart-bar fake-chart-bar--teal${item.secondary === 0 ? ' is-zero' : ''}`}
                style={{ height: `${item.secondary === 0 ? 0 : Math.max(10, (item.secondary / maxValue) * 100)}%` }}
              />
            </div>
            <strong>{item.primary}/{item.secondary}</strong>
            <small>{showLabel ? item.label : ''}</small>
          </div>
        )})}
      </div>
    </>
  )
}

function AdminPieChart({ data }) {
  const total = data.reduce((sum, item) => sum + Number(item?.value || 0), 0)
  let offset = 0
  const gradient = data
    .map((item, index) => {
      const value = Number(item?.value || 0)
      const start = offset
      offset += total > 0 ? (value / total) * 100 : 0
      const color = CHART_PALETTE[index % CHART_PALETTE.length]
      return `${color} ${start}% ${offset}%`
    })
    .join(', ')

  return (
    <div className="admin-pie-wrap">
      <div className="fake-pie" style={{ background: total > 0 ? `conic-gradient(${gradient})` : undefined }} />
      <div className="admin-pie-legend">
        {data.map((item, index) => (
          <div className="admin-pie-legend-item" key={item.label}>
            <span><i className="legend-swatch" style={{ background: CHART_PALETTE[index % CHART_PALETTE.length] }} /> {item.label}</span>
            <strong>{Number(item?.value || 0)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

const CHART_PALETTE = ['#2563eb', '#0f766e', '#ea580c', '#16a34a', '#f59e0b', '#7c3aed', '#64748b']

