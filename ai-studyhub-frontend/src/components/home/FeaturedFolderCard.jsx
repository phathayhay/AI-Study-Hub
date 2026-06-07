import StudyHubIcon from '../icons/StudyHubIcons'
import Badge from '../ui/Badge'

export default function FeaturedFolderCard({ folder }) {
  return (
    <article className={`folder-card ${folder.active ? 'is-highlighted' : ''}`}>
      <div className="folder-card__icon">
        <StudyHubIcon name="folder" size={28} />
      </div>

      <div className="folder-card__body">
        <div className="folder-card__meta">
          <Badge tone="blue">{folder.code}</Badge>
          <button className="icon-button" type="button" aria-label={`Lưu ${folder.title}`}>
            <StudyHubIcon name="heart" size={20} />
          </button>
        </div>
        <h3>{folder.title}</h3>
        <p>{folder.description}</p>
        <div className="card-stats">
          <span>
            <StudyHubIcon name="file" size={16} />
            {folder.files}
          </span>
          <span>
            <StudyHubIcon name="download" size={16} />
            {folder.downloads}
          </span>
        </div>
      </div>
    </article>
  )
}
