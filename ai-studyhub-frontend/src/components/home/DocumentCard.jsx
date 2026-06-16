import StudyHubIcon from '../icons/StudyHubIcons'
import Badge from '../ui/Badge'

export default function DocumentCard({ document }) {
  return (
    <article className="document-card">
      <div className="document-card__header">
        <div className="document-card__badges">
          <Badge tone="blue">{document.code}</Badge>
          <Badge>{document.type}</Badge>
        </div>
        <button className="icon-button" type="button" aria-label={`Lưu ${document.title}`}>
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
          Tải về
        </button>
      </div>
    </article>
  )
}
