import { useEffect, useRef, useState } from 'react'
import FeaturedDocuments from '../../components/home/FeaturedDocuments'
import FeaturedFolders from '../../components/home/FeaturedFolders'
import HeroSearch from '../../components/home/HeroSearch'
import StatsSummary from '../../components/home/StatsSummary'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { appUser, featuredDocuments, featuredFolders, recentActivities, majors, popularCourses } from '../../data/studyHubData'
import { pricingPlans } from './config'
import { DocumentCardMini, ExploreFolderCard, InfoLine, PageTitle, SectionTitle } from './shared'
import { 
  getMyDocuments, getDocument, uploadDocument, searchDocuments,
  favoriteDocument, unfavoriteDocument, rateDocument,
  getDocumentComments, addDocumentComment, getFavoriteDocuments
} from '../../features/documents/documentService'
import { getRootFolders, getFolder } from '../../features/folders/folderService'

const uploadSelectFields = [
  {
    label: 'Ngành học *',
    placeholder: 'Chọn ngành học',
    options: ['Công nghệ thông tin', 'Kỹ thuật phần mềm', 'Trí tuệ nhân tạo', 'An toàn thông tin', 'Thiết kế đồ họa', 'Ngôn ngữ Nhật'],
  },
  {
    label: 'Học kỳ *',
    placeholder: 'Chọn học kỳ',
    options: ['Kỳ 1', 'Kỳ 2', 'Kỳ 3', 'Kỳ 4', 'Kỳ 5', 'Kỳ 6', 'Kỳ 7', 'Kỳ 8', 'Kỳ 9'],
  },
  {
    label: 'Mã môn học *',
    hint: '[1 môn]',
    placeholder: 'Chọn mã môn học',
    options: ['PRF192', 'PRO192', 'CSD201', 'DBI202', 'SWP391', 'CEA201', 'JPD316', 'MAS291'],
  },
  {
    label: 'Loại tài liệu *',
    placeholder: 'Chọn loại tài liệu',
    options: ['Slide', 'Notes', 'Assignment', 'Lab', 'Exam', 'Source Code', 'Project'],
  },
]

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

export function ExplorePage({ onNavigate, onOpenDocument, onOpenFolder, guest = false }) {
  const [selectedMajor, setSelectedMajor] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    if (guest) return
    getFavoriteDocuments()
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.content || res?.content || [])
        setFavoriteIds(new Set(list.map(item => item.id)))
      })
      .catch((err) => console.error('Failed to load favorites', err))
  }, [guest])

  const courses = [
    { code: 'PRF192', name: 'Programming Fundamentals', count: 12, icon: 'code' },
    { code: 'PRO192', name: 'Object-Oriented Programming', count: 8, icon: 'server' },
    { code: 'CSD201', name: 'Data Structures & Algorithms', count: 15, icon: 'layers' },
    { code: 'DBI202', name: 'Introduction to Databases', count: 10, icon: 'database' },
    { code: 'SWP391', name: 'Software Development Project', count: 6, icon: 'cpu' },
    { code: 'CEA201', name: 'Computer Architecture', count: 9, icon: 'monitor' },
  ]

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    const params = {
      keyword: searchQuery,
      size: 40,
    }

    searchDocuments(params)
      .then((res) => {
        if (!active) return
        // Extract content array from pagination response
        const docs = res?.content || res?.data?.content || res || []
        setDocuments(docs)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'Không thể tải tài liệu từ backend.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [searchQuery])

  // Filter documents by major on client side for maximum reliability,
  // since mock database documents might have majorId: null.
  const filteredDocuments = documents.filter(doc => {
    if (selectedMajor === 'ALL') return true
    const titleLower = (doc.title || '').toLowerCase()
    
    const isSE = titleLower.includes('dbi') || titleLower.includes('prf') || titleLower.includes('pro') || titleLower.includes('csd') || titleLower.includes('swp') || titleLower.includes('cea') || titleLower.includes('se')
    const isAI = titleLower.includes('ai') || titleLower.includes('artificial') || titleLower.includes('trí tuệ')
    const isGD = titleLower.includes('gd') || titleLower.includes('graphic') || titleLower.includes('design') || titleLower.includes('thiết kế')

    if (selectedMajor === 'SE') return isSE
    if (selectedMajor === 'AI') return isAI
    if (selectedMajor === 'GD') return isGD
    return true
  })

  const filteredFolders = featuredFolders.filter(f => {
    if (selectedMajor !== 'ALL' && f.code && !f.code.startsWith(selectedMajor)) return false
    if (searchQuery && !f.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getDocCourseCode = (doc) => {
    const title = doc.title || ''
    const match = title.match(/([a-zA-Z]{3}\d{3})/i)
    if (match) return match[1].toUpperCase()
    const wordMatch = title.match(/(PRF|PRO|CSD|DBI|SWP|CEA|MAS|JPD)/i)
    return wordMatch ? wordMatch[1].toUpperCase() : (doc.fileType || 'DOC')
  }

  return (
    <main className="home-main" style={{ overflowY: 'auto', flex: 1, padding: '0 24px' }}>
      <div className="home-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px 0 40px' }}>
        
        {/* Hero Search Section */}
        <section className="hero-section" aria-labelledby="home-title" style={{ padding: '24px 0', width: '100%' }}>
          <h1 id="home-title">{guest ? 'Tài liệu học tập cho sinh viên FPTU' : 'Tài liệu học tập FPTU'}</h1>
          <p>Tìm kiếm, chia sẻ và quản lý tài liệu học tập với sức mạnh AI</p>

          <div className="hero-search" role="search" style={{ margin: '28px auto 0', background: '#fff' }}>
            <StudyHubIcon name="search" size={20} />
            <input 
              placeholder="Tìm kiếm theo mã môn học hoặc tiêu đề (VD: CEA201, PRF192, SWP391...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8', padding: '0 8px' }}
              >
                ×
              </button>
            )}
          </div>

          <div className="hero-filters" aria-label="Bộ lọc nhanh" style={{ width: '100%', maxWidth: '768px', margin: '24px auto 0' }}>
            <div className="filter-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Môn học phổ biến:</span>
              {popularCourses.map((course) => (
                <button 
                  className={searchQuery.toUpperCase() === course ? 'chip chip--accent' : 'chip'} 
                  key={course} 
                  type="button"
                  onClick={() => setSearchQuery(course)}
                >
                  {course}
                </button>
              ))}
            </div>
            <div className="filter-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Ngành học:</span>
              {['ALL', 'SE', 'AI', 'GD'].map((major) => (
                <button 
                  className={selectedMajor === major ? 'chip chip--accent' : 'chip'} 
                  key={major} 
                  type="button"
                  onClick={() => setSelectedMajor(major)}
                >
                  {major === 'ALL' ? 'Tất cả' : major}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics section */}
        <StatsSummary />

        {/* Featured Folders Section (Mocked) */}
        <div style={{ marginTop: '16px' }}>
          <SectionTitle icon="folder" title="Thư mục học tập (Mô phỏng)" count={filteredFolders.length} />
          <div onClick={() => onOpenFolder?.(1)} role="presentation" style={{ cursor: 'pointer', marginTop: '16px' }}>
            <FeaturedFolders />
          </div>
        </div>

        {/* Dynamic Documents Section */}
        <div style={{ marginTop: '16px' }}>
          <SectionTitle icon="file" title="Tài liệu học tập thực tế" count={filteredDocuments.length} />
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải tài liệu từ backend...</div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
          ) : filteredDocuments.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy tài liệu nào.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '16px' }}>
              {filteredDocuments.map((doc) => (
                <DocumentCardMini
                  key={doc.id}
                  document={{
                    id: doc.id,
                    code: getDocCourseCode(doc),
                    type: doc.fileType || 'PDF',
                    title: doc.title,
                    description: doc.description || 'Không có mô tả chi tiết.',
                    downloads: doc.totalDownloads || 0,
                    rating: doc.averageRating || 0,
                    favorite: favoriteIds.has(doc.id),
                  }}
                  onOpen={() => onOpenDocument?.(doc.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
export function UploadPage({ mode = 'document', onStudyFileUploaded, onNavigate }) {
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [uploadedText, setUploadedText] = useState('')
  const [readStatus, setReadStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const visibilityRef = useRef(null)
  const tagsRef = useRef(null)
  const isStudyUpload = mode === 'study'

  const handleFileSelect = async (files) => {
    const [file] = Array.from(files ?? [])
    if (!file) return

    setSelectedUploadFile(file)
    setUploadedText('')
    setReadStatus('')
    setUploadError('')
    setUploadSuccess(false)

    if (canReadAsText(file)) {
      try {
        const text = await file.text()
        setUploadedText(text.trim())
        setReadStatus(text.trim() ? 'Đã đọc nội dung file.' : 'File không có nội dung text để hiển thị.')
      } catch {
        setReadStatus('Chưa đọc được nội dung file.')
      }
    }
  }

  const clearSelectedFile = () => {
    setSelectedUploadFile(null)
    setUploadedText('')
    setReadStatus('')
    setUploadError('')
    setUploadSuccess(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startStudySession = () => {
    handleUpload()
  }

  const handleUpload = async () => {
    if (!selectedUploadFile) return
    const title = titleRef.current?.value?.trim() || selectedUploadFile.name
    const description = descRef.current?.value?.trim() || ''
    const visibility = visibilityRef.current?.value || 'PRIVATE'
    const tagsRaw = tagsRef.current?.value?.trim() || ''
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []
    setUploading(true)
    setUploadError('')
    setUploadSuccess(false)
    try {
      const res = await uploadDocument(selectedUploadFile, { title, description, visibility, tags })
      const doc = res?.data || res
      setUploadSuccess(true)
      window.showToast?.('Document uploaded successfully', 'success')
      setTimeout(() => {
        clearSelectedFile()
        if (onStudyFileUploaded) {
          onStudyFileUploaded({
            id: doc?.id || doc?.documentId,
            name: title,
            attachmentName: selectedUploadFile.name,
            content: '',
            fileUrl: doc?.fileUrl || '',
          })
        }
        if (onNavigate) onNavigate('study')
      }, 1000)
    } catch (err) {
      const errMsg = err?.message || 'Upload failed'
      setUploadError(errMsg)
      window.showToast?.(errMsg, 'error')
    } finally { setUploading(false) }
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
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp"
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
            {uploadError && <p className="auth-error">{uploadError}</p>}
            {uploadSuccess && <p className="upload-success">Tải lên thành công!</p>}
            <label>Tiêu đề tài liệu *<input ref={titleRef} defaultValue={selectedUploadFile.name} placeholder="Nhập tiêu đề tài liệu" /></label>
            <label>Mô tả<textarea ref={descRef} placeholder="Mô tả ngắn gọn nội dung tài liệu..." /></label>
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
              <label>Hiển thị<select ref={visibilityRef} defaultValue="PRIVATE">
                <option value="PUBLIC">Public</option><option value="PRIVATE">Private</option>
              </select></label>
              <label>Tags (phân cách bằng dấu phẩy)<input ref={tagsRef} placeholder="SWP, Study, ..." /></label>
            </div>
            <div className="upload-form__actions">
              <button className="upload-submit" onClick={isStudyUpload ? startStudySession : handleUpload} type="button" disabled={uploading}>
                {uploading ? 'Đang tải lên...' : isStudyUpload ? 'Bắt đầu học với AI' : 'Tải lên'}
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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  return (
    <main className="page-surface profile-page">
      <section className="profile-card">
        <div className="profile-avatar">{user?.fullName?.[0] || 'SV'}</div>
        <div>
          <h1>{user?.fullName || appUser.name} <button type="button"><StudyHubIcon name="edit" size={16} /> Chỉnh sửa</button></h1>
          <p><StudyHubIcon name="mail" size={16} /> {user?.email || appUser.email}</p>
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

export function FolderDetailPage({ id, onNavigate, onLoad, onOpenDocument }) {
  const [folder, setFolder] = useState(null)
  const [favoriteIds, setFavoriteIds] = useState(new Set())

  useEffect(() => {
    const hasToken = !!localStorage.getItem('accessToken')
    if (!hasToken) return
    getFavoriteDocuments()
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.content || res?.content || [])
        setFavoriteIds(new Set(list.map(item => item.id)))
      })
      .catch((err) => console.error('Failed to load favorites', err))
  }, [])

  useEffect(() => {
    if (!id) return
    getFolder(id).then((res) => {
      const data = res?.data || res
      setFolder(data)
      onLoad?.(data)
    }).catch(() => {
      onLoad?.({ id, name: 'PRF192 - Programming Fundamentals Full Pack' })
    })
  }, [id, onLoad])

  const f = folder || {
    name: 'PRF192 - Programming Fundamentals Full Pack',
    description: 'Bộ tài liệu hoàn chỉnh PRF192: Slides bài giảng, Source code mẫu, Đề thi + Đáp án',
    documents: []
  }

  const docCount = f.documents?.length || 0

  return (
    <main className="page-surface folder-detail-page">
      <button className="text-link" onClick={() => onNavigate('explore')} type="button">← Quay lại danh sách</button>
      <p className="breadcrumb">Khám phá › {f.name}</p>
      <h1>{f.name}</h1>
      <p>{f.description || 'Thư mục tài liệu học tập'}</p>
      <section className="folder-hero-card">
        <span><StudyHubIcon name="folder" size={36} /></span>
        <Badge tone="blue">{f.id?.toString().slice(-6) || 'FOL'}</Badge>
        <small><StudyHubIcon name="file" size={14} /> {docCount} tài liệu</small>
        <small><StudyHubIcon name="download" size={14} /> 0 lượt tải</small>
        <button className="primary-action" type="button"><StudyHubIcon name="download" size={18} /> Tải về toàn bộ folder</button>
      </section>
      <SectionTitle icon="file" title="Tài liệu trong thư mục" count={docCount} />
      <div className="document-grid document-grid--single">
        {docCount > 0 ? (
          f.documents.map((doc) => (
            <DocumentCardMini 
              key={doc.id}
              doc={{
                id: doc.id,
                title: doc.title || doc.fileName || 'Untitled Document',
                downloads: doc.totalDownloads || 0,
                views: doc.totalViews || 0,
                rating: doc.averageRating || 0,
                type: doc.fileType || 'DOC',
                favorite: favoriteIds.has(doc.id),
              }}
              onOpen={() => onOpenDocument?.(doc.id)}
            />
          ))
        ) : (
          <p style={{ opacity: 0.5, gridColumn: '1 / -1' }}>Chưa có tài liệu nào trong thư mục này</p>
        )}
      </div>
    </main>
  )
}

export function DocumentDetailPage({ id, onBack, onReport, guest = false, onNavigate, onOpenStudyFile, onLoad }) {
  const [doc, setDoc] = useState(null)
  const [comments, setComments] = useState([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [commentContent, setCommentContent] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    getDocument(id).then((res) => {
      const data = res?.data || res
      setDoc(data)
      onLoad?.(data)
    }).catch(() => {
      onLoad?.({ id, title: 'Untitled Document' })
    })

    // Load comments
    getDocumentComments(id)
      .then((res) => {
        const list = res?.data || res || []
        setComments(list)
      })
      .catch((err) => console.error('Failed to load comments', err))

    // Check if favorited
    if (!guest) {
      getFavoriteDocuments()
        .then((res) => {
          const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : res?.data?.content || res?.content || [])
          const isFav = list.some(fav => fav.id === Number(id))
          setIsFavorite(isFav)
        })
        .catch((err) => console.error('Failed to check favorites', err))
    }
  }, [id, onLoad, guest])

  const d = doc || featuredDocuments[1]

  const handleStudyWithAI = () => {
    if (guest) {
      onNavigate?.('login')
    } else if (onOpenStudyFile) {
      onOpenStudyFile({
        id: d.id,
        name: d.title || 'Untitled Document',
        subject: d.subject || d.type || 'Document',
        fileUrl: d.fileUrl || '',
      })
    }
  }

  const handleToggleFavorite = () => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    const apiCall = isFavorite ? unfavoriteDocument(d.id) : favoriteDocument(d.id)
    apiCall
      .then(() => {
        setIsFavorite(!isFavorite)
        window.showToast?.(isFavorite ? 'Removed from favorites' : 'Added to favorites', 'success')
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Error updating favorites', 'error')
      })
  }

  const handleRate = (value) => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    rateDocument(d.id, value)
      .then(() => {
        setUserRating(value)
        window.showToast?.('Rated successfully', 'success')
        // Refresh document details to update average rating
        getDocument(id).then(res => {
          const data = res?.data || res
          setDoc(data)
        })
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to submit rating', 'error')
      })
  }

  const handleAddComment = () => {
    if (guest) {
      onNavigate?.('login')
      return
    }
    if (!commentContent.trim()) return
    setCommentsLoading(true)
    addDocumentComment(d.id, commentContent.trim())
      .then(() => {
        setCommentContent('')
        window.showToast?.('Comment added successfully', 'success')
        // Reload comments
        return getDocumentComments(d.id)
      })
      .then((res) => {
        setComments(res?.data || res || [])
      })
      .catch((err) => {
        window.showToast?.(err.message || 'Failed to add comment', 'error')
      })
      .finally(() => setCommentsLoading(false))
  }

  return (
    <main className="page-surface document-detail-page">
      <div className="doc-layout">
        <section className="doc-main-card">
          <button className="text-link" onClick={onBack} type="button">← Quay lại</button>
          <div className="doc-tags"><Badge tone="blue">{d.code || d.id?.toString().slice(-6)}</Badge><Badge>{d.fileType || d.type}</Badge></div>
          <h1>{d.title}</h1>
          <p>{d.description}</p>
          <div className="doc-metrics">
            <span><StudyHubIcon name="download" size={15} /> {d.downloads || d.totalDownloads || 0} lượt tải</span>
            <span><StudyHubIcon name="eye" size={15} /> {d.views || d.totalViews || 0} lượt xem</span>
            <span className="rating">★ {d.rating || d.averageRating || 0} </span>
          </div>
          <h2>Xem trước</h2>
          {d.fileUrl ? (
            (d.fileUrl.toLowerCase().endsWith('.pdf') || (d.fileType || d.type || '').toUpperCase() === 'PDF') ? (
              <div className="document-preview-container" style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: '16px' }}>
                <iframe
                  src={d.fileUrl}
                  width="100%"
                  height="100%"
                  title="Document Preview"
                  style={{ backgroundColor: '#f1f5f9', border: 'none' }}
                />
              </div>
            ) : (d.fileUrl.includes('localhost') || d.fileUrl.includes('127.0.0.1')) ? (
              <div style={{ padding: '32px', border: '1px solid #e5e7eb', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <StudyHubIcon name="file" size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>Không thể xem trước tệp trên localhost</h4>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    Google Docs Viewer không thể đọc file từ máy chủ cục bộ (localhost). Vui lòng tải xuống để xem.
                  </p>
                </div>
                <a
                  href={d.fileUrl}
                  download={d.title || 'document'}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, textDecoration: 'none' }}
                >
                  <StudyHubIcon name="download" size={14} /> Tải tài liệu về máy
                </a>
              </div>
            ) : (
              <div className="document-preview-container" style={{ width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: '16px' }}>
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(d.fileUrl)}&embedded=true`}
                  width="100%"
                  height="100%"
                  title="Document Preview"
                  style={{ backgroundColor: '#f1f5f9', border: 'none' }}
                />
              </div>
            )
          ) : (
            <div className="preview-box">
              <StudyHubIcon name="file" size={48} />
              <p>Không có tệp để xem trước</p>
              <small>Tài liệu này chưa có nội dung đính kèm</small>
            </div>
          )}
        </section>
        <aside className="doc-info-card">
          <h2>Thông tin tài liệu</h2>
          <InfoLine icon="user" label="Người tải lên" value={d.uploader || 'N/A'} />
          <InfoLine icon="calendar" label="Ngày tải lên" value={d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.date || 'N/A'} />
          <InfoLine icon="file" label="Môn học" value={d.subject || d.fileType || 'N/A'} />
          {d.fileUrl && (
            <button
              className="primary-action"
              type="button"
              onClick={() => {
                if (guest) {
                  onNavigate?.('login')
                } else {
                  window.open(d.fileUrl, '_blank')
                }
              }}
            >
              <StudyHubIcon name="download" size={16} /> Tải xuống
            </button>
          )}
          <button className="purple-button" type="button" onClick={handleStudyWithAI}>
            <StudyHubIcon name="message" size={16} /> Chat với AI
          </button>
          <button className="success-button" type="button" onClick={() => guest ? onNavigate?.('login') : null}>
            <StudyHubIcon name="share" size={16} /> Chia sẻ
          </button>
          <button 
            className={isFavorite ? "success-button" : "muted-button"} 
            type="button" 
            onClick={handleToggleFavorite}
            style={isFavorite ? { color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fff5f5' } : undefined}
          >
            <StudyHubIcon name="heart" size={16} /> {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
          </button>
          <button
            className="danger-outline"
            onClick={() => {
              if (guest) {
                onNavigate?.('login')
              } else {
                onReport?.()
              }
            }}
            type="button"
          >
            <StudyHubIcon name="flag" size={16} /> Báo cáo
          </button>
          <div className="rating-row" style={{ display: 'flex', gap: '6px', cursor: 'pointer', fontSize: '22px', color: '#eab308', padding: '8px 0', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                onClick={() => handleRate(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ transition: 'transform 0.1s' }}
              >
                {star <= (hoverRating || userRating || Math.round(d.rating || d.averageRating || 0)) ? '★' : '☆'}
              </span>
            ))}
          </div>
        </aside>
      </div>
      <section className="comments-card">
        <h2><StudyHubIcon name="message" size={18} /> Bình luận ({comments.length})</h2>
        <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div className="comment-row" key={comment.id} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
                  {(comment.user?.fullName || comment.userName || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{comment.user?.fullName || comment.userName || 'Sinh viên'}</strong>
                    <small style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Vừa xong'}
                    </small>
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, whiteSpace: 'pre-line' }}>{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p style={{ opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
          )}
        </div>
        <textarea
          placeholder={guest ? "Đăng nhập để viết bình luận..." : "Viết bình luận của bạn..."}
          disabled={guest}
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          style={{ width: '100%', minHeight: '80px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', color: '#0f172a', resize: 'vertical', outline: 'none' }}
        />
        <button
          className="primary-action"
          type="button"
          disabled={guest || commentsLoading || !commentContent.trim()}
          onClick={handleAddComment}
          style={{ marginTop: '12px' }}
        >
          {commentsLoading ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
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
