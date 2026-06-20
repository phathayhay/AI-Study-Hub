import { useState, useEffect } from 'react'
import StudyHubIcon, { getFileIconName, getFileIconColor } from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { favoriteDocument, unfavoriteDocument } from '../../features/documents/documentService'

export function SectionTitle({ count, icon, title }) {
  return <h2 className="inline-section-title"><StudyHubIcon name={icon} size={18} /> {title} <small>({count})</small></h2>
}

export function ExploreFolderCard({ folder, onOpen }) {
  const [favorite, setFavorite] = useState(Boolean(folder.favorite))

  return (
    <article className="explore-folder-card" onClick={onOpen}>
      <span className="folder-card__icon"><StudyHubIcon name="folder" size={24} /></span>
      <div className="folder-card__meta">
        <Badge tone="blue">{folder.code}</Badge>
        <small>{folder.date}</small>
        <button
          className={`icon-button ${favorite ? 'is-active' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            setFavorite((value) => !value)
          }}
          type="button"
        >
          <StudyHubIcon name="heart" size={16} />
        </button>
      </div>
      <h3>{folder.title}</h3>
      <p>{folder.description}</p>
      <div className="card-stats">
        <span><StudyHubIcon name="file" size={14} /> {folder.files} documents</span>
        <span><StudyHubIcon name="download" size={14} /> {folder.downloads} downloads</span>
        <button className="download-button" type="button">Download</button>
      </div>
      <small>Created by {folder.author}</small>
    </article>
  )
}

export function DocumentCardMini({ document, doc, onOpen }) {
  const d = document || doc
  const [favorite, setFavorite] = useState(Boolean(d?.favorite))

  useEffect(() => {
    setFavorite(Boolean(d?.favorite))
  }, [d?.favorite])

  const handleToggleFavorite = (event) => {
    event.stopPropagation()
    const hasToken = !!localStorage.getItem('accessToken')
    if (!hasToken) {
      window.showToast?.('Please login to add to favorites', 'info')
      return
    }

    const docId = d?.id
    if (!docId) {
      window.showToast?.('Document does not have a valid ID', 'error')
      return
    }

    const apiCall = favorite ? unfavoriteDocument(docId) : favoriteDocument(docId)
    apiCall
      .then(() => {
        setFavorite(!favorite)
        window.showToast?.(favorite ? 'Removed from favorites' : 'Added to favorites', 'success')
      })
      .catch(err => {
        window.showToast?.(err.message || 'Error updating favorites', 'error')
      })
  }

  const typeUpper = (d?.type || 'PDF').toUpperCase()
  let typeBadgeBg = 'bg-slate-100 text-slate-600 border border-slate-200'
  if (typeUpper === 'PDF') {
    typeBadgeBg = 'bg-red-50 text-red-600 border border-red-100'
  } else if (typeUpper === 'DOCX' || typeUpper === 'DOC') {
    typeBadgeBg = 'bg-blue-50 text-blue-600 border border-blue-100'
  } else if (typeUpper === 'PPTX' || typeUpper === 'PPT') {
    typeBadgeBg = 'bg-amber-50 text-amber-600 border border-amber-100'
  }

  return (
    <article className="document-card" onClick={onOpen}>
      <div className="document-card__header">
        <div className="document-card__badges">
          <Badge tone="blue">{d?.code}</Badge>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${typeBadgeBg}`}>
            <StudyHubIcon name={getFileIconName(typeUpper)} size={12} className="flex-shrink-0" />
            {typeUpper}
          </span>
        </div>
        <button
          className={`icon-button ${favorite ? 'is-active' : ''}`}
          onClick={handleToggleFavorite}
          type="button"
        >
          <StudyHubIcon name="heart" size={18} />
        </button>
      </div>
      <h3>{d?.title}</h3>
      <p>{d?.description}</p>
      <div className="document-card__footer">
        <div className="card-stats"><span><StudyHubIcon name="download" size={14} /> {d?.downloads}</span><span className="rating">★ {d?.rating}</span></div>
        <button className="download-button" type="button">Download</button>
      </div>
    </article>
  )
}

export function PageTitle({ centered = false, subtitle, title }) {
  return <header className={`page-title ${centered ? 'page-title--centered' : ''}`}><h1>{title}</h1><p>{subtitle}</p></header>
}

export function InfoLine({ icon, label, value }) {
  return <div className="info-line"><StudyHubIcon name={icon} size={16} /><p><small>{label}</small><strong>{value}</strong></p></div>
}

export function InfoBlock({ label, value }) {
  return <p className="info-block"><small>{label}</small><strong>{value}</strong></p>
}
