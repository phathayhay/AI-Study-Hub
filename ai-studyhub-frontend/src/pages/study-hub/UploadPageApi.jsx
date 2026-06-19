import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { uploadDocument } from '../../services/documentService'
import { getRootFolders } from '../../services/folderService'
import { PageTitle } from './shared'

const MAX_FILE_SIZE = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'pptx']

export default function UploadPageApi({ mode = 'document', onStudyFileUploaded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [courseCode, setCourseCode] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [folderId, setFolderId] = useState('')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [tags, setTags] = useState('')
  const [folders, setFolders] = useState([])
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const isStudyUpload = mode === 'study'

  useEffect(() => {
    let active = true
    getRootFolders()
      .then((data) => {
        if (active) setFolders(data)
      })
      .catch(() => {
        if (active) setFolders([])
      })
    return () => {
      active = false
    }
  }, [])

  const selectFile = (files) => {
    const [selected] = Array.from(files ?? [])
    if (!selected) return

    const extension = selected.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('Chỉ hỗ trợ file PDF, DOCX hoặc PPTX.')
      resetFileInput()
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('Dung lượng file không được vượt quá 50MB.')
      resetFileInput()
      return
    }

    setFile(selected)
    setTitle(selected.name.replace(/\.[^.]+$/, ''))
    setStatus('')
    setError('')
  }

  const clearFile = () => {
    setFile(null)
    setTitle('')
    setDescription('')
    setCourseCode('')
    setCategoryName('')
    setFolderId('')
    setVisibility('PRIVATE')
    setTags('')
    setStatus('')
    setError('')
    resetFileInput()
  }

  const resetFileInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      setError('Vui lòng chọn file và nhập tiêu đề.')
      return
    }

    setUploading(true)
    setStatus('')
    setError('')
    try {
      const document = await uploadDocument(file, {
        title,
        description,
        courseCode,
        categoryName,
        folderId,
        visibility,
        tags: tags.split(','),
      })

      setStatus('Tài liệu đã được tải lên thành công.')
      if (isStudyUpload && onStudyFileUploaded) {
        onStudyFileUploaded({
          id: document.id,
          documentId: document.id,
          name: document.title,
          attachmentName: document.fileName,
          subject: document.description || document.fileType,
          sizeLabel: formatFileSize(document.fileSize),
          fileUrl: document.fileUrl,
          content: '',
        })
      }
    } catch (requestError) {
      setError(getUploadErrorMessage(requestError))
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="page-surface upload-page">
      <PageTitle
        title={isStudyUpload ? 'Tạo Study Session mới' : 'Tải lên tài liệu'}
        subtitle={isStudyUpload ? 'Tải file lên để AI tạo workspace học tập' : 'Chia sẻ tài liệu hoặc lưu trữ cá nhân'}
      />
      <section className="upload-card">
        {!file ? (
          <>
            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={(event) => selectFile(event.target.files)}
            />
            <div
              className="drop-zone"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                selectFile(event.dataTransfer.files)
              }}
            >
              <StudyHubIcon name="upload" size={46} />
              <h3>Kéo thả file vào đây</h3>
              <p>hoặc</p>
              <button className="file-picker-button" onClick={() => inputRef.current?.click()} type="button">
                <StudyHubIcon name="file" size={18} /> Chọn file
              </button>
              <small>Hỗ trợ: PDF, DOCX, PPTX (tối đa 50MB)</small>
            </div>
            {error && <p className="api-status api-status--error">{error}</p>}
          </>
        ) : (
          <div className="upload-form">
            <h3>File đã chọn</h3>
            <div className="selected-file">
              <StudyHubIcon name="file" size={18} />
              <span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span>
              <button aria-label="Bỏ file đã chọn" disabled={uploading} onClick={clearFile} type="button">×</button>
            </div>
            <label>Tiêu đề tài liệu *<input onChange={(event) => setTitle(event.target.value)} value={title} /></label>
            <label>Mô tả<textarea onChange={(event) => setDescription(event.target.value)} value={description} /></label>
            <div className="upload-form__grid">
              <label>
                Mã môn học
                <input onChange={(event) => setCourseCode(event.target.value)} placeholder="VD: PRF192" value={courseCode} />
              </label>
              <label>
                Danh mục
                <input onChange={(event) => setCategoryName(event.target.value)} placeholder="VD: Exam" value={categoryName} />
              </label>
              <label>
                Thư mục
                <select onChange={(event) => setFolderId(event.target.value)} value={folderId}>
                  <option value="">Thư mục gốc</option>
                  {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.folderName}</option>)}
                </select>
              </label>
              <label>
                Quyền xem
                <select onChange={(event) => setVisibility(event.target.value)} value={visibility}>
                  <option value="PRIVATE">Riêng tư</option>
                  <option value="PUBLIC">Công khai</option>
                </select>
              </label>
            </div>
            <label>Tags<input onChange={(event) => setTags(event.target.value)} placeholder="java, database, exam" value={tags} /></label>
            {status && <p className="api-status">{status}</p>}
            {error && <p className="api-status api-status--error">{error}</p>}
            <div className="upload-form__actions">
              <button className="upload-submit" disabled={uploading} onClick={handleUpload} type="button">
                {uploading ? 'Đang tải lên...' : isStudyUpload ? 'Tải lên và học với AI' : 'Tải lên'}
              </button>
              <button className="cancel-button" disabled={uploading} onClick={clearFile} type="button">Hủy</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function getUploadErrorMessage(error) {
  if (error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  if (error.status === 413) return 'Dung lượng file vượt quá giới hạn 50MB.'
  if (error.status === 400) return error.message || 'Thông tin tài liệu hoặc định dạng file không hợp lệ.'
  return error.message || 'Không thể tải tài liệu lên. Vui lòng thử lại.'
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}
