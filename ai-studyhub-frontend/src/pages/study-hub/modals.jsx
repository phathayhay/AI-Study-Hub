import { useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { featuredDocuments, notifications } from '../../data/studyHubData'
import { InfoBlock } from './shared'

export function NotificationPanel({ onClose }) {
  return (
    <aside className="notification-panel">
      <header>
        <h2><StudyHubIcon name="bell" size={22} /> Thông báo <span>3</span></h2>
        <button type="button">✓ Đọc tất cả</button>
        <button onClick={onClose} type="button"><StudyHubIcon name="close" size={18} /></button>
      </header>
      <nav>{['Tất cả', 'Chưa đọc', 'Tài liệu', 'Tương tác'].map((item, index) => <button className={index === 0 ? 'is-active' : ''} key={item}>{item}<small>{index ? index + 1 : ''}</small></button>)}</nav>
      {notifications.map((item) => (
        <article className={`notice-item notice-item--${item.type}`} key={item.id}>
          <span><StudyHubIcon name={item.icon} size={22} /></span>
          <div><h3>{item.title}</h3><p>{item.text}</p><strong>{item.author}</strong> <small>{item.time}</small></div>
        </article>
      ))}
      <button className="all-notifications" type="button">Xem tất cả thông báo ›</button>
    </aside>
  )
}

export function FilePreviewModal({ file, onClose, onView }) {
  const [opening, setOpening] = useState(false)

  const handleView = () => {
    if (opening) return
    setOpening(true)
    onView()
  }

  return (
    <div className="modal-backdrop">
      <section className="file-modal">
        <header><h2>{file.name}</h2><button onClick={onClose} type="button">×</button></header>
        <div className="file-preview-hero"><StudyHubIcon name="file" size={82} /><p>{file.kind} Document</p><small>{file.category ?? file.subject}</small></div>
        <InfoBlock label="Document Name" value={file.name} />
        <InfoBlock label="Type" value={file.kind} />
        <InfoBlock label="Category" value={file.category ?? file.subject} />
        <InfoBlock label="Upload Date" value={file.date} />
        <footer>
          <button disabled={opening} onClick={onClose} type="button">Close</button>
          <button className="purple-button" disabled={opening} onClick={handleView} type="button">
            <StudyHubIcon name="eye" size={16} /> {opening ? 'Opening...' : 'View Full Document'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export function ReportModal({ onClose }) {
  const doc = featuredDocuments[2]
  return (
    <div className="modal-backdrop">
      <section className="report-modal">
        <header><h2><StudyHubIcon name="flag" size={18} /> Báo cáo tài liệu</h2><button onClick={onClose} type="button">×</button></header>
        <div className="report-doc"><Badge tone="blue">{doc.code}</Badge><strong>{doc.title}</strong></div>
        <label>Lý do báo cáo *<input /></label>
        <label>Mô tả chi tiết (tùy chọn)<textarea placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải với tài liệu này..." /></label>
        <div className="warning-box">Lưu ý: Báo cáo sai sự thật có thể dẫn đến việc tài khoản bị khóa.</div>
        <footer><button onClick={onClose} type="button">Hủy</button><button className="danger-button" type="button">Gửi báo cáo</button></footer>
      </section>
    </div>
  )
}
