import { useRef, useState } from 'react'
import FeaturedDocuments from '../../components/home/FeaturedDocuments'
import FeaturedFolders from '../../components/home/FeaturedFolders'
import HeroSearch from '../../components/home/HeroSearch'
import StatsSummary from '../../components/home/StatsSummary'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { appUser, featuredDocuments, featuredFolders, pricingPlans, recentActivities, uploadSelectFields } from '../../packages/mooc-data'
import { DocumentCardMini, ExploreFolderCard, InfoLine, PageTitle, SectionTitle } from './shared'

export function HomeScreen({ guest = false, onNavigate }) {
  return (
    <main className="home-main">
      <div className="home-container">
        <HeroSearch title={guest ? 'Tài liệu học tập cho sinh viên FPTU' : 'Tài liệu học tập FPTU'} />
        <StatsSummary />
        <div onClick={() => onNavigate('folder-detail')} role="presentation">
          <FeaturedFolders />
        </div>
        <div onClick={() => onNavigate('doc-detail')} role="presentation">
          <FeaturedDocuments />
        </div>
      </div>
    </main>
  )
}

export function ExplorePage({ onNavigate }) {
  return (
    <main className="page-surface page-surface--narrow">
      <PageTitle title="Khám phá tài liệu" subtitle="Tìm kiếm và khám phá hàng nghìn tài liệu học tập từ cộng đồng FPTU" />
      <div className="filter-panel">
        <div className="search-line">
          <StudyHubIcon name="search" size={16} />
          <input placeholder="Tìm kiếm theo mã môn học, nội dung tài liệu..." />
        </div>
        <div className="filter-grid">
          {['Ngành học', 'Học kỳ', 'Mã môn học', 'Loại tài liệu'].map((label, index) => (
            <label key={label}>
              <span>{label}</span>
              <select>
                <option>
                  {index === 0 ? 'Tất cả ngành' : index === 1 ? 'Tất cả học kỳ' : index === 2 ? 'Chọn học kỳ hoặc ngành trước' : 'Tất cả loại'}
                </option>
              </select>
            </label>
          ))}
        </div>
      </div>

      <p className="result-count">Tìm thấy 7 thư mục và 8 tài liệu</p>
      <SectionTitle icon="folder" title="Thư mục" count={7} />
      <div className="explore-folder-grid">
        {featuredFolders.map((folder) => (
          <ExploreFolderCard folder={folder} key={folder.code} onOpen={() => onNavigate('folder-detail')} />
        ))}
      </div>
      <SectionTitle icon="file" title="Tài liệu" count={8} />
      <div className="document-grid">
        {featuredDocuments.map((document) => (
          <DocumentCardMini document={document} key={`${document.code}-${document.type}`} onOpen={() => onNavigate('doc-detail')} />
        ))}
      </div>
    </main>
  )
}

export function UploadPage({ mode = 'document', onStudyFileUploaded }) {
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [uploadedText, setUploadedText] = useState('')
  const [readStatus, setReadStatus] = useState('')
  const fileInputRef = useRef(null)
  const isStudyUpload = mode === 'study'

  const handleFileSelect = async (files) => {
    const [file] = Array.from(files ?? [])
    if (!file) return

    setSelectedUploadFile(file)
    setUploadedText('')
    setReadStatus('')

    if (!canReadAsText(file)) {
      setReadStatus('File đã được chọn. Định dạng này cần parser/backend để đọc nội dung trực tiếp.')
      return
    }

    try {
      const text = await file.text()
      setUploadedText(text.trim())
      setReadStatus(text.trim() ? 'Đã đọc nội dung file.' : 'File không có nội dung text để hiển thị.')
    } catch {
      setReadStatus('Chưa đọc được nội dung file. Vui lòng thử file khác.')
    }
  }

  const clearSelectedFile = () => {
    setSelectedUploadFile(null)
    setUploadedText('')
    setReadStatus('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startStudySession = () => {
    if (!selectedUploadFile || !onStudyFileUploaded) return

    onStudyFileUploaded({
      name: selectedUploadFile.name,
      attachmentName: selectedUploadFile.name,
      subject: selectedUploadFile.type || 'Imported file',
      sizeLabel: formatFileSize(selectedUploadFile.size),
      content: uploadedText,
      readStatus,
    })
  }

  return (
    <main className="page-surface upload-page">
      <PageTitle
        title={isStudyUpload ? 'Tạo Study Session mới' : 'Tải lên tài liệu'}
        subtitle={isStudyUpload ? 'Tải file lên để AI tạo workspace học tập từ nội dung của bạn' : 'Chia sẻ tài liệu học tập với cộng đồng FPTU hoặc lưu trữ cá nhân'}
      />
      <section className="upload-card">
        {!selectedUploadFile ? (
          <>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.md,.csv,.json"
              onChange={(event) => handleFileSelect(event.target.files)}
            />
            <div
              className="drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                handleFileSelect(event.dataTransfer.files)
              }}
            >
              <StudyHubIcon name="upload" size={46} />
              <h3>Kéo thả file hoặc folder vào đây</h3>
              <p>hoặc</p>
              <button className="file-picker-button" onClick={() => fileInputRef.current?.click()} type="button">
                <StudyHubIcon name="file" size={18} /> Chọn file
              </button>
              <small>Hỗ trợ: PDF, Word, PowerPoint, ZIP (tối đa 50MB)</small>
            </div>
            <button className="upload-submit" onClick={() => fileInputRef.current?.click()} type="button">Tải lên</button>
          </>
        ) : (
          <div className="upload-form">
            <h3>File đã chọn (1)</h3>
            <div className="selected-file">
              <StudyHubIcon name="file" size={18} />
              <span><strong>{selectedUploadFile.name}</strong><small>{formatFileSize(selectedUploadFile.size)}</small></span>
              <button onClick={clearSelectedFile} type="button">×</button>
            </div>
            {readStatus && <p className="upload-read-status">{readStatus}</p>}
            <label>Tiêu đề tài liệu *<input defaultValue={selectedUploadFile.name} placeholder="Nhập tiêu đề tài liệu" /></label>
            <label>Mô tả<textarea placeholder="Mô tả ngắn gọn nội dung tài liệu..." /></label>
            <div className="upload-form__grid">
              {uploadSelectFields.map((field) => (
                <label key={field.label}>
                  {field.label} {field.hint && <small>{field.hint}</small>}
                  <select defaultValue="">
                    <option disabled value="">{field.placeholder}</option>
                    {field.options.map((option) => <option key={option}>{option}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="upload-form__actions">
              <button className="upload-submit" onClick={startStudySession} type="button">
                {isStudyUpload ? 'Bắt đầu học với AI' : 'Tải lên'}
              </button>
              <button className="cancel-button" onClick={clearSelectedFile} type="button">Hủy</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export function ProfilePage() {
  return (
    <main className="page-surface profile-page">
      <section className="profile-card">
        <div className="profile-avatar">SV</div>
        <div>
          <h1>{appUser.name} <button type="button"><StudyHubIcon name="edit" size={16} /> Chỉnh sửa</button></h1>
          <p><StudyHubIcon name="mail" size={16} /> {appUser.email}</p>
          <p><StudyHubIcon name="globe" size={16} /> {appUser.city}</p>
          <p><StudyHubIcon name="calendar" size={16} /> {appUser.joined}</p>
        </div>
      </section>
      <div className="profile-stats">
        {[
          ['upload', '12', 'Tài liệu tải lên'],
          ['download', '1,234', 'Lượt tải về'],
          ['star', '4.8', 'Đánh giá trung bình'],
        ].map(([icon, value, label]) => (
          <article key={label}>
            <span><StudyHubIcon name={icon} size={24} /></span>
            <strong>{value}</strong>
            <small>{label}</small>
          </article>
        ))}
      </div>
      <section className="activity-card">
        <h2>Hoạt động gần đây</h2>
        {recentActivities.map(([text, time]) => (
          <div className="activity-row" key={text}>
            <span><StudyHubIcon name="user" size={18} /></span>
            <p>{text}<small>{time}</small></p>
          </div>
        ))}
      </section>
    </main>
  )
}

function canReadAsText(file) {
  const readableExtensions = ['.txt', '.md', '.csv', '.json', '.html', '.css', '.js', '.jsx', '.ts', '.tsx']
  const lowerName = file.name.toLowerCase()
  return file.type.startsWith('text/') || readableExtensions.some((extension) => lowerName.endsWith(extension))
}

export function FolderDetailPage({ onNavigate }) {
  return (
    <main className="page-surface folder-detail-page">
      <button className="text-link" onClick={() => onNavigate('explore')} type="button">← Quay lại danh sách</button>
      <p className="breadcrumb">Khám phá › PRF192 - Programming Fundamentals Full Pack</p>
      <h1>PRF192 - Programming Fundamentals Full Pack</h1>
      <p>Bộ tài liệu hoàn chỉnh PRF192: Slides bài giảng, Source code mẫu, Đề thi + Đáp án</p>
      <section className="folder-hero-card">
        <span><StudyHubIcon name="folder" size={36} /></span>
        <Badge tone="blue">PRF192</Badge>
        <small><StudyHubIcon name="file" size={14} /> 1 tài liệu</small>
        <small><StudyHubIcon name="download" size={14} /> 5,678 lượt tải</small>
        <button className="primary-action" type="button"><StudyHubIcon name="download" size={18} /> Tải về toàn bộ folder</button>
      </section>
      <SectionTitle icon="file" title="Tài liệu trong thư mục" count={1} />
      <div className="document-grid document-grid--single">
        <DocumentCardMini document={{ ...featuredDocuments[1], code: 'DTG302', title: 'DTG302 - Motion Graphics Final Project', downloads: '432', rating: '4.7' }} onOpen={() => onNavigate('doc-detail')} />
      </div>
    </main>
  )
}

export function DocumentDetailPage({ onBack, onReport }) {
  const doc = featuredDocuments[1]
  return (
    <main className="page-surface document-detail-page">
      <div className="doc-layout">
        <section className="doc-main-card">
          <button className="text-link" onClick={onBack} type="button">← Quay lại</button>
          <div className="doc-tags"><Badge tone="blue">{doc.code}</Badge><Badge>{doc.type}</Badge></div>
          <h1>{doc.title}</h1>
          <p>{doc.description}</p>
          <div className="doc-metrics">
            <span><StudyHubIcon name="download" size={15} /> {doc.downloads} lượt tải</span>
            <span><StudyHubIcon name="eye" size={15} /> {doc.views} lượt xem</span>
            <span className="rating">★ {doc.rating} (124 đánh giá)</span>
          </div>
          <h2>Xem trước</h2>
          <div className="preview-box">
            <StudyHubIcon name="file" size={48} />
            <p>Preview tài liệu sẽ hiển thị tại đây</p>
            <small>PDF, Word, PowerPoint viewer</small>
          </div>
        </section>
        <aside className="doc-info-card">
          <h2>Thông tin tài liệu</h2>
          <InfoLine icon="user" label="Người tải lên" value={doc.uploader} />
          <InfoLine icon="calendar" label="Ngày tải lên" value={doc.date} />
          <InfoLine icon="file" label="Môn học" value={doc.subject} />
          <button className="primary-action" type="button"><StudyHubIcon name="download" size={16} /> Tải xuống</button>
          <button className="purple-button" type="button"><StudyHubIcon name="message" size={16} /> Chat với AI</button>
          <button className="success-button" type="button"><StudyHubIcon name="share" size={16} /> Chia sẻ</button>
          <button className="muted-button" type="button"><StudyHubIcon name="heart" size={16} /> Yêu thích</button>
          <button className="danger-outline" onClick={onReport} type="button"><StudyHubIcon name="flag" size={16} /> Báo cáo</button>
          <div className="rating-row">☆ ☆ ☆ ☆ ☆</div>
        </aside>
      </div>
      <section className="comments-card">
        <h2><StudyHubIcon name="message" size={18} /> Bình luận (12)</h2>
        {[1, 2, 3].map((item) => (
          <div className="comment-row" key={item}>
            <span>SV</span>
            <p><strong>Sinh viên {item}</strong> <small>{item} ngày trước</small><br />Tài liệu rất chi tiết và dễ hiểu. Cảm ơn bạn đã chia sẻ!</p>
          </div>
        ))}
        <textarea placeholder="Viết bình luận của bạn..." />
        <button className="primary-action" type="button">Gửi bình luận</button>
      </section>
    </main>
  )
}

export function PricingPage({ onNavigate }) {
  return (
    <main className="page-surface pricing-page">
      <button aria-label="Quay lại" className="back-pill" onClick={() => onNavigate('library')} type="button">
        <StudyHubIcon name="arrow-left" size={18} />
      </button>
      <PageTitle title="Chọn gói phù hợp với bạn" subtitle="Nâng cấp để trải nghiệm đầy đủ tính năng học tập AI" centered />
      <button className="billing-pill" type="button">Hằng tháng</button>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => (
          <article className={`pricing-card pricing-card--${plan.tone}`} key={plan.id}>
            {plan.popular && <span className="popular-ribbon">Phổ biến nhất</span>}
            <span className="plan-icon"><StudyHubIcon name={plan.id === 'free' ? 'star' : 'book'} size={30} /></span>
            <h2>{plan.name}</h2>
            <p>{plan.subtitle}</p>
            <strong>{plan.price}<small>/tháng</small></strong>
            <ul>
              {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
              {plan.disabled.map((feature) => <li className="disabled" key={feature}>× {feature}</li>)}
            </ul>
            <button className={plan.id === 'premium' ? 'purple-button' : 'primary-action'} disabled={plan.id === 'free'} type="button">
              {plan.id === 'free' ? 'Bắt đầu miễn phí' : `Nâng cấp ${plan.name} →`}
            </button>
          </article>
        ))}
      </div>
      <section className="faq-card">
        <h2>Câu hỏi thường gặp</h2>
        {[
          'Tôi có thể hủy bất cứ lúc nào không?',
          'Phương thức thanh toán nào được chấp nhận?',
          'Tôi có được hoàn tiền không?',
          'Tôi có thể nâng cấp hoặc hạ cấp gói không?',
        ].map((question) => (
          <div key={question}><h3>{question}</h3><p>Có, bạn có thể thay đổi hoặc hủy bất cứ lúc nào. Phí được tính theo thời gian sử dụng.</p></div>
        ))}
      </section>
    </main>
  )
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** unitIndex
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}
