import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'

export function SectionTitle({ count, icon, title }) {
  return <h2 className="inline-section-title"><StudyHubIcon name={icon} size={18} /> {title} <small>({count})</small></h2>
}

export function ExploreFolderCard({ folder, onOpen }) {
  return (
    <article className="explore-folder-card" onClick={onOpen}>
      <span className="folder-card__icon"><StudyHubIcon name="folder" size={24} /></span>
      <div className="folder-card__meta"><Badge tone="blue">{folder.code}</Badge><small>{folder.date}</small><button className="icon-button" type="button"><StudyHubIcon name="heart" size={16} /></button></div>
      <h3>{folder.title}</h3>
      <p>{folder.description}</p>
      <div className="card-stats"><span><StudyHubIcon name="file" size={14} /> {folder.files} tài liệu</span><span><StudyHubIcon name="download" size={14} /> {folder.downloads} lượt tải</span><button className="download-button" type="button">Tải về</button></div>
      <small>Tạo bởi {folder.author}</small>
    </article>
  )
}

export function DocumentCardMini({ document, onOpen }) {
  return (
    <article className="document-card" onClick={onOpen}>
      <div className="document-card__header">
        <div className="document-card__badges"><Badge tone="blue">{document.code}</Badge><Badge>{document.type}</Badge></div>
        <button className="icon-button" type="button"><StudyHubIcon name="heart" size={18} /></button>
      </div>
      <h3>{document.title}</h3>
      <p>{document.description}</p>
      <div className="document-card__footer">
        <div className="card-stats"><span><StudyHubIcon name="download" size={14} /> {document.downloads}</span><span className="rating">★ {document.rating}</span></div>
        <button className="download-button" type="button">Tải về</button>
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
