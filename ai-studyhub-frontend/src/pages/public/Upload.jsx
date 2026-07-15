import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { PageTitle } from '../study-hub/shared'
import {
  uploadDocument
} from '../../features/documents/documentService'
import { getMajors, getCourses, getCategories } from '../../services/courseService'

const SHARED_FOUNDATION_PREFIXES = ['PRF', 'PRO', 'CSD', 'DBI', 'MAD', 'MAE', 'OSG', 'JPD', 'WED', 'SWT', 'SSI', 'PFP', 'SSL']

function resolveMajorCode(majorValue, majorsList = []) {
  if (!majorValue) return ''
  const rawValue = String(majorValue).trim()
  const normalizedValue = rawValue.toUpperCase()
  const matchedMajor = majorsList.find(
    (major) => major.majorCode?.toUpperCase() === normalizedValue || major.majorName?.toUpperCase() === normalizedValue
  )
  if (matchedMajor?.majorCode) {
    return String(matchedMajor.majorCode).toUpperCase()
  }
  const fallbackMap = {
    'SOFTWARE ENGINEERING': 'SE',
    'ARTIFICIAL INTELLIGENCE': 'AI',
    'INFORMATION ASSURANCE': 'IA',
    'INFORMATION SECURITY': 'SS',
    'GRAPHIC DESIGN': 'GD',
    'JAPANESE LANGUAGE': 'JL',
  }
  return fallbackMap[normalizedValue] || normalizedValue
}

function isSharedFoundationCourse(courseCode = '') {
  const normalizedCourseCode = String(courseCode).trim().toUpperCase()
  return SHARED_FOUNDATION_PREFIXES.some((prefix) => normalizedCourseCode.startsWith(prefix))
}

function getCourseMajorCodes(course, majorsList = []) {
  const codesFromMajors = Array.isArray(course?.majors)
    ? course.majors
        .map((major) => resolveMajorCode(major?.majorCode || major?.majorName, majorsList))
        .filter(Boolean)
    : []
  if (codesFromMajors.length > 0) {
    return [...new Set(codesFromMajors)]
  }
  const fallbackCode = resolveMajorCode(course?.major?.majorCode || course?.major?.majorName, majorsList)
  return fallbackCode ? [fallbackCode] : []
}

function isCourseEligibleForMajor(course, selectedMajor, majorsList = []) {
  const selectedMajorCode = resolveMajorCode(selectedMajor, majorsList)
  if (!selectedMajorCode || selectedMajorCode === 'ALL') return true
  if (isSharedFoundationCourse(course?.courseCode)) return true
  return getCourseMajorCodes(course, majorsList).includes(selectedMajorCode)
}

function canReadAsText(file) {
  const readableExtensions = ['.txt', '.md', '.csv', '.json', '.html', '.css', '.js', '.jsx', '.ts', '.tsx']
  const lowerName = file.name.toLowerCase()
  return file.type.startsWith('text/') || readableExtensions.some((extension) => lowerName.endsWith(extension))
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const size = bytes / 1024 ** unitIndex
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`
}

export function UploadPage({ mode = 'document', onStudyFileUploaded, onDocumentUploaded, onNavigate, defaultFolderId = null, user = null }) {
  const [selectedUploadFile, setSelectedUploadFile] = useState(null)
  const [uploadedText, setUploadedText] = useState('')
  const [readStatus, setReadStatus] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [selectedMajor, setSelectedMajor] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const [majorsList, setMajorsList] = useState([])
  const [coursesList, setCoursesList] = useState([])
  const [categoriesList, setCategoriesList] = useState([])

  useEffect(() => {
    getMajors().then(res => {
      if (res?.success && Array.isArray(res?.data)) setMajorsList(res.data.filter(m => m.majorCode !== 'ALL'))
    }).catch(err => console.error(err))

    getCourses().then(res => {
      if (res?.success && Array.isArray(res?.data)) setCoursesList(res.data)
    }).catch(err => console.error(err))

    getCategories().then(res => {
      if (res?.success && Array.isArray(res?.data)) setCategoriesList(res.data)
    }).catch(err => console.error(err))
  }, [])

  const fileInputRef = useRef(null)
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const visibilityRef = useRef(null)
  const tagsRef = useRef(null)
  
  const isStudyUpload = mode === 'study'
  const storageLimitMb = Number(user?.planStorageLimitMb || 0)
  const storageUsedBytes = Number(user?.planStorageUsedBytes || 0)
  const storageUsedMb = Number.isFinite(user?.planStorageUsedMb) ? Number(user.planStorageUsedMb) : storageUsedBytes / (1024 * 1024)
  const remainingStorageBytes = Math.max((storageLimitMb * 1024 * 1024) - storageUsedBytes, 0)
  const selectedFileSize = Number(selectedUploadFile?.size || 0)
  const isOverQuota = Boolean(user?.overQuota)
  const wouldExceedQuota = !isOverQuota && selectedFileSize > 0 && selectedFileSize > remainingStorageBytes
  const uploadBlocked = isOverQuota || wouldExceedQuota
  const quotaWarningMessage = isOverQuota
    ? (user?.storageMessage || 'Your current storage usage exceeds the FREE plan limit. You can still view, download, and delete your existing documents, but uploading new documents is temporarily disabled.')
    : wouldExceedQuota
      ? 'This file would push your storage beyond the current plan limit. Delete some files or upgrade your plan before uploading.'
      : ''

  const handleFileSelect = async (files) => {
    const [file] = Array.from(files ?? [])
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the limit of 10MB. Please select a smaller file.')
      window.showToast?.('File size exceeds 10MB limit', 'error')
      setSelectedUploadFile(null)
      return
    }

    setSelectedUploadFile(file)
    setUploadedText('')
    setReadStatus('')
    setUploadError('')
    setUploadSuccess(false)

    if (canReadAsText(file)) {
      try {
        const text = await file.text()
        setUploadedText(text.trim())
        setReadStatus(text.trim() ? 'File content read successfully.' : 'No text content found in the file to display.')
      } catch {
        setReadStatus('Unable to read file content.')
      }
    }
  }

  const clearSelectedFile = () => {
    setSelectedUploadFile(null)
    setUploadedText('')
    setReadStatus('')
    setUploadError('')
    setUploadSuccess(false)
    setSelectedMajor('')
    setSelectedSemester('')
    setSelectedCourse('')
    setSelectedCategory('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!selectedUploadFile) return
    if (uploadBlocked) {
      const message = quotaWarningMessage || 'Storage limit exceeded. Delete existing files or upgrade your plan.'
      setUploadError(message)
      window.showToast?.(message, 'error')
      return
    }
    if (selectedUploadFile.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the limit of 10MB. Please select a smaller file.')
      window.showToast?.('File size exceeds 10MB limit', 'error')
      return
    }
    const title = titleRef.current?.value?.trim() || ''
    const description = descRef.current?.value?.trim() || ''
    const visibility = visibilityRef.current?.value || 'PRIVATE'
    const tagsRaw = tagsRef.current?.value?.trim() || ''
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []

    const requiredFields = [
      { value: title, label: 'Document Title' },
      { value: selectedMajor, label: 'Major' },
      { value: selectedSemester, label: 'Semester' },
      { value: selectedCourse, label: 'Course Code' },
      { value: selectedCategory, label: 'Document Type' },
    ]

    const missingField = requiredFields.find((field) => !field.value)
    if (missingField) {
      const message = `${missingField.label} is required before uploading.`
      setUploadError(message)
      window.showToast?.(message, 'error')
      return
    }

    const courseObj = coursesList.find(c => c.courseCode === selectedCourse)
    const courseId = courseObj ? courseObj.id : null

    const categoryObj = categoriesList.find(c => c.categoryName === selectedCategory)
    const categoryId = categoryObj ? categoryObj.id : null

    setUploading(true)
    setUploadError('')
    setUploadSuccess(false)
    try {
      const res = await uploadDocument(selectedUploadFile, {
        title,
        description,
        visibility,
        tags,
        courseId,
        categoryId,
        folderId: defaultFolderId || undefined
      })
      const doc = res?.data || res
      setUploadSuccess(true)
      window.showToast?.('Document uploaded successfully', 'success')
      setTimeout(() => {
        onDocumentUploaded?.(doc)
        clearSelectedFile()
        if (isStudyUpload && onStudyFileUploaded) {
          onStudyFileUploaded({
            id: doc?.id || doc?.documentId,
            documentId: doc?.id || doc?.documentId,
            name: title,
            attachmentName: selectedUploadFile.name,
            content: '',
            fileUrl: doc?.fileUrl || '',
            visibility: doc?.visibility || visibility || 'PRIVATE',
            folderId: doc?.folderId ?? defaultFolderId ?? null,
          })
        }
        if (!isStudyUpload && onNavigate) {
          onNavigate('doc-detail', { documentId: doc?.id || doc?.documentId })
        }
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
        title={isStudyUpload ? 'Create New Study Session' : 'Upload Document'}
        subtitle={isStudyUpload ? 'Upload a file to let AI create a study workspace from your content' : 'Share study documents with the FPTU community or store them privately'}
      />
      <section className="upload-card">
        {(isOverQuota || wouldExceedQuota) && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-left text-sm text-amber-900">
            <strong className="block text-sm font-semibold">Storage attention needed</strong>
            <p className="mt-2 mb-0 leading-6">
              {quotaWarningMessage}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span><strong>Current plan:</strong> {user?.planName || 'FREE'}</span>
              <span><strong>Used:</strong> {formatFileSize(storageUsedBytes)}</span>
              <span><strong>Limit:</strong> {formatFileSize(storageLimitMb * 1024 * 1024)}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="file-picker-button text-xs cursor-pointer" onClick={() => onNavigate?.('library')} type="button">
                Manage Documents
              </button>
              <button className="cancel-button text-xs cursor-pointer" onClick={() => onNavigate?.('pricing')} type="button">
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
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
              <h3>Drag and drop files or folders here</h3>
              <p>or</p>
              <button className="file-picker-button cursor-pointer" disabled={isOverQuota} onClick={() => fileInputRef.current?.click()} type="button">
                <StudyHubIcon name="file" size={18} /> Select File
              </button>
              <small>Supported formats: PDF, Word, PowerPoint, ZIP (max 10MB)</small>
            </div>
            <button className="upload-submit cursor-pointer" disabled={isOverQuota} onClick={() => fileInputRef.current?.click()} type="button">Upload</button>
          </>
        ) : (
          <div className="upload-form">
            <h3>Selected File (1)</h3>
            <div className="selected-file">
              <StudyHubIcon name="file" size={18} />
              <span><strong>{selectedUploadFile.name}</strong><small>{formatFileSize(selectedUploadFile.size)}</small></span>
              <button className="cursor-pointer" onClick={clearSelectedFile} type="button">×</button>
            </div>
            {readStatus && <p className="upload-read-status">{readStatus}</p>}
            {uploadError && <p className="auth-error">{uploadError}</p>}
            {uploadSuccess && <p className="upload-success">Uploaded successfully!</p>}
            <label>Document Title *<input ref={titleRef} defaultValue={selectedUploadFile.name} placeholder="Enter document title" /></label>
            <label>Description<textarea ref={descRef} placeholder="Brief description of the document..." /></label>
            <div className="upload-form__grid">
              {(() => {
                const dynamicSelectFields = [
                  {
                    label: 'Major *',
                    placeholder: 'Select major',
                    options: majorsList.map(m => m.majorName),
                    value: selectedMajor,
                    onChange: (e) => {
                      setSelectedMajor(e.target.value)
                      setSelectedCourse('')
                    }
                  },
                  {
                    label: 'Semester *',
                    placeholder: 'Select semester',
                    options: ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8', 'Semester 9'],
                    value: selectedSemester,
                    onChange: (e) => setSelectedSemester(e.target.value)
                  },
                  {
                    label: 'Course Code *',
                    hint: '[1 course]',
                    placeholder: 'Select course code',
                    options: coursesList
                      .filter(c => !selectedMajor || isCourseEligibleForMajor(c, selectedMajor, majorsList))
                      .map(c => c.courseCode),
                    value: selectedCourse,
                    onChange: (e) => setSelectedCourse(e.target.value)
                  },
                  {
                    label: 'Document Type *',
                    placeholder: 'Select document type',
                    options: categoriesList.map(c => c.categoryName),
                    value: selectedCategory,
                    onChange: (e) => setSelectedCategory(e.target.value)
                  }
                ]

                return dynamicSelectFields.map((field) => (
                  <label key={field.label}>
                    {field.label} {field.hint && <small>{field.hint}</small>}
                    <select value={field.value} onChange={field.onChange}>
                      <option disabled value="">{field.placeholder}</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                ))
              })()}
              <label>Visibility<select ref={visibilityRef} defaultValue="PRIVATE">
                <option value="PUBLIC">Public</option><option value="PRIVATE">Private</option>
              </select></label>
              <label>Tags (separated by commas)<input ref={tagsRef} placeholder="SWP, Study, ..." /></label>
            </div>
            <div className="upload-form__actions">
              <button className="upload-submit cursor-pointer" onClick={isStudyUpload ? handleUpload : handleUpload} type="button" disabled={uploading || uploadBlocked}>
                {uploading
                  ? 'Uploading...'
                  : uploadBlocked
                    ? (isOverQuota ? 'Upload disabled' : 'Over plan limit')
                    : (isStudyUpload ? 'Start Studying with AI' : 'Upload')}
              </button>
              <button className="cancel-button cursor-pointer" onClick={clearSelectedFile} type="button">Cancel</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
