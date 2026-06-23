import { useEffect, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { uploadDocument } from '../../features/documents/documentService'
import { getRootFolders } from '../../features/folders/folderService'
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
      setError('Only PDF, DOCX, or PPTX files are supported.')
      resetFileInput()
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('File size cannot exceed 50MB.')
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
      setError('Please select a file and enter a title.')
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

      setStatus('Document uploaded successfully.')
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
        title={isStudyUpload ? 'Create New Study Session' : 'Upload Document'}
        subtitle={isStudyUpload ? 'Upload a file to let AI create a study workspace' : 'Share documents or store them privately'}
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
              <h3>Drag and drop files here</h3>
              <p>or</p>
              <button className="file-picker-button" onClick={() => inputRef.current?.click()} type="button">
                <StudyHubIcon name="file" size={18} /> Select File
              </button>
              <small>Supported: PDF, DOCX, PPTX (max 50MB)</small>
            </div>
            {error && <p className="api-status api-status--error">{error}</p>}
          </>
        ) : (
          <div className="upload-form">
            <h3>Selected File</h3>
            <div className="selected-file">
              <StudyHubIcon name="file" size={18} />
              <span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span>
              <button aria-label="Remove selected file" disabled={uploading} onClick={clearFile} type="button">×</button>
            </div>
            <label>Document Title *<input onChange={(event) => setTitle(event.target.value)} value={title} /></label>
            <label>Description<textarea onChange={(event) => setDescription(event.target.value)} value={description} /></label>
            <div className="upload-form__grid">
              <label>
                Course Code
                <input onChange={(event) => setCourseCode(event.target.value)} placeholder="e.g. PRF192" value={courseCode} />
              </label>
              <label>
                Category
                <input onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Exam" value={categoryName} />
              </label>
              <label>
                Folder
                <select onChange={(event) => setFolderId(event.target.value)} value={folderId}>
                  <option value="">Root Folder</option>
                  {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.folderName}</option>)}
                </select>
              </label>
              <label>
                Visibility
                <select onChange={(event) => setVisibility(event.target.value)} value={visibility}>
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                </select>
              </label>
            </div>
            <label>Tags<input onChange={(event) => setTags(event.target.value)} placeholder="java, database, exam" value={tags} /></label>
            {status && <p className="api-status">{status}</p>}
            {error && <p className="api-status api-status--error">{error}</p>}
            <div className="upload-form__actions">
              <button className="upload-submit" disabled={uploading} onClick={handleUpload} type="button">
                {uploading ? 'Uploading...' : isStudyUpload ? 'Upload and Learn with AI' : 'Upload'}
              </button>
              <button className="cancel-button" disabled={uploading} onClick={clearFile} type="button">Cancel</button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function getUploadErrorMessage(error) {
  if (error.status === 401) return 'Session expired. Please log in again.'
  if (error.status === 413) return 'File size exceeds the 50MB limit.'
  if (error.status === 400) return error.message || 'Invalid document information or file format.'
  return error.message || 'Unable to upload document. Please try again.'
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}
