import { useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import Badge from '../ui/Badge'

export default function DocumentCard({ document }) {
  const [favorite, setFavorite] = useState(Boolean(document.favorite))

  return (
    <article className="document-card">
      <div className="document-card__header">
        <div className="document-card__badges">
          <Badge tone="blue">{document.code}</Badge>
          <Badge>{document.type}</Badge>
        </div>
        <button
          className={`icon-button ${favorite ? 'is-active' : ''}`}
          type="button"
          aria-label={`Save ${document.title}`}
          onClick={(event) => {
            event.stopPropagation()
            setFavorite((value) => !value)
          }}
        >
          <StudyHubIcon name="heart" size={20} />
        </button>
      </div>

      <h3>{document.title}</h3>
      <p>{document.description}</p>

      <div className="document-card__footer">
        <div className="card-stats">
          <span>
            <StudyHubIcon name="download" size={16} />
            {document.downloads}
          </span>
          <span className="rating">★ {document.rating}</span>
        </div>
        <button className="download-button" type="button">
          <StudyHubIcon name="download" size={16} />
          Download
        </button>
      </div>
    </article>
  )
}
