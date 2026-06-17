import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { fillRoute, ROUTES } from '../../constants/routes'
import { libraryTabs } from './config'
import {
  createFolder,
  deleteFolder,
  getFolderDetails,
  getRootFolders,
  renameFolder,
} from '../../services/folderService'
import {
  addDocumentFavorite,
  deleteDocument,
  getMyDocuments,
  removeDocumentFavorite,
  updateDocumentVisibility,
} from '../../services/documentService'

export function LibraryPage({ activeTab, onNavigate, onOpenFile, onTabChange }) {
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [folders, setFolders] = useState([])
  const [documents, setDocuments] = useState([])
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null)
  const [openFileMenuId, setOpenFileMenuId] = useState(null)
  const [shareFile, setShareFile] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getRootFolders(), getMyDocuments()])
      .then(([folderData, documentData]) => {
        if (!active) return
        setFolders(folderData.map(mapFolder))
        setDocuments(documentData.map(mapDocument))
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visibleDocuments = useMemo(() => {
    if (activeTab === 'shared') return documents.filter((document) => document.public)
    if (activeTab === 'favorites') return documents.filter((document) => document.favorite)
    return activeTab === 'recent' ? documents : documents.slice(0, 4)
  }, [activeTab, documents])

  const tabCounts = useMemo(() => ({
    sessions: documents.length,
    shared: documents.filter((document) => document.public).length,
    favorites: documents.filter((document) => document.favorite).length,
    folders: folders.length,
    recent: documents.length,
  }), [documents, folders])

  const runRequest = async (request) => {
    setError('')
    try {
      await request()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleAddFolder = () => runRequest(async () => {
    const folderName = window.prompt('Nhập tên thư mục mới')?.trim()
    if (!folderName) return
    const createdFolder = mapFolder(await createFolder(folderName))
    setFolders((current) => [...current, createdFolder])
    setSelectedFolder(null)
    onTabChange('folders')
  })

  const handleRenameFolder = (folder) => runRequest(async () => {
    const folderName = window.prompt('Nhập tên thư mục mới', folder.name)?.trim()
    if (!folderName) return
    const updated = mapFolder(await renameFolder(folder.id, folderName, folder.parentFolderId))
    setFolders((current) => current.map((item) => item.id === folder.id ? updated : item))
    setSelectedFolder((current) => current?.id === folder.id ? { ...current, ...updated } : current)
    setOpenFolderMenuId(null)
  })

  const handleDeleteFolder = (folder) => runRequest(async () => {
    if (!window.confirm(`Xóa thư mục "${folder.name}" và toàn bộ nội dung?`)) return
    await deleteFolder(folder.id)
    setFolders((current) => current.filter((item) => item.id !== folder.id))
    if (selectedFolder?.id === folder.id) setSelectedFolder(null)
    setOpenFolderMenuId(null)
  })

  const handleOpenFolder = (folder) => runRequest(async () => {
    const details = await getFolderDetails(folder.id)
    setSelectedFolder({
      ...mapFolder(details),
      documents: (details.documents ?? []).map(mapDocument),
      subfolders: (details.subfolders ?? []).map(mapFolder),
    })
  })

  const handleDeleteDocument = (file) => runRequest(async () => {
    if (!window.confirm(`Xóa tài liệu "${file.name}"?`)) return
    await deleteDocument(file.id)
    setDocuments((current) => current.filter((item) => item.id !== file.id))
    setSelectedFolder((current) => current
      ? { ...current, documents: current.documents.filter((item) => item.id !== file.id) }
      : current)
    setOpenFileMenuId(null)
  })

  const updateDocumentState = (updatedDocument) => {
    setDocuments((current) => current.map((item) => (
      item.id === updatedDocument.id ? { ...item, ...updatedDocument } : item
    )))
    setSelectedFolder((current) => current
      ? {
        ...current,
        documents: current.documents.map((item) => (
          item.id === updatedDocument.id ? { ...item, ...updatedDocument } : item
        )),
      }
      : current)
  }

  const handleToggleFavorite = (file) => runRequest(async () => {
    const updated = file.favorite
      ? await removeDocumentFavorite(file.id)
      : await addDocumentFavorite(file.id)
    updateDocumentState(mapDocument(updated))
  })

  const handleOpenShare = (file) => {
    setOpenFileMenuId(null)
    setShareFile(file)
  }

  const handleUpdateDocumentVisibility = (visibility) => runRequest(async () => {
    if (!shareFile || sharing) return
    setSharing(true)
    try {
      const updated = mapDocument(await updateDocumentVisibility(shareFile.id, visibility))
      updateDocumentState(updated)
      setShareFile(null)
      if (visibility === 'PUBLIC') onTabChange('shared')
    } finally {
      setSharing(false)
    }
  })

  return (
    <div className="library-shell">
      <LibraryRail activeTab={activeTab} counts={tabCounts} onNavigate={onNavigate} onTabChange={onTabChange} />
      <main className="library-main">
        <div className="library-header">
          <div><h1>Thư viện của bạn</h1></div>
          <div className="library-actions">
            <label>Sort: <select><option>Last accessed</option></select></label>
            <button className="square-button" onClick={() => onNavigate('upload')} type="button">
              <StudyHubIcon name="upload" size={18} />
            </button>
            <button className="primary-action" onClick={handleAddFolder} type="button">
              <StudyHubIcon name="plus" size={18} /> Folder
            </button>
          </div>
        </div>
        <div className="search-line library-search">
          <StudyHubIcon name="search" size={18} />
          <input placeholder="Search by title or content type..." />
        </div>
        {loading && <p className="api-status">Đang tải thư viện...</p>}
        {error && <p className="api-status api-status--error">{error}</p>}

        {activeTab === 'folders' ? (
          selectedFolder ? (
            <FolderFilesView
              files={selectedFolder.documents ?? []}
              folder={selectedFolder}
              onBack={() => setSelectedFolder(null)}
              onDeleteFile={handleDeleteDocument}
              onOpenFile={onOpenFile}
              onShareFile={handleOpenShare}
              onToggleFavorite={handleToggleFavorite}
              onToggleFileMenu={setOpenFileMenuId}
              openFileMenuId={openFileMenuId}
            />
          ) : (
            <FolderGrid
              folders={folders}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
              onSelectFolder={handleOpenFolder}
              onToggleMenu={setOpenFolderMenuId}
              openMenuId={openFolderMenuId}
            />
          )
        ) : (
          <DocumentList
            files={visibleDocuments}
            onDeleteFile={handleDeleteDocument}
            onOpenFile={onOpenFile}
            onShareFile={handleOpenShare}
            onToggleFavorite={handleToggleFavorite}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
          />
        )}
        {shareFile && (
          <ShareDocumentModal
            file={shareFile}
            loading={sharing}
            onClose={() => setShareFile(null)}
            onSave={handleUpdateDocumentVisibility}
          />
        )}
      </main>
    </div>
  )
}

function FolderGrid({ folders, onDeleteFolder, onRenameFolder, onSelectFolder, onToggleMenu, openMenuId }) {
  return (
    <div className="folder-library-grid">
      {folders.map((folder) => (
        <article className="library-folder" key={folder.id} onClick={() => onSelectFolder(folder)} role="button" tabIndex={0}>
          <button
            className="folder-menu-trigger"
            onClick={(event) => {
              event.stopPropagation()
              onToggleMenu(openMenuId === folder.id ? null : folder.id)
            }}
            type="button"
          >
            ...
          </button>
          {openMenuId === folder.id && (
            <div className="folder-action-menu" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => onRenameFolder(folder)} type="button">Đổi tên</button>
              <button className="is-danger" onClick={() => onDeleteFolder(folder)} type="button">Xóa folder</button>
            </div>
          )}
          <span><StudyHubIcon name="folder" size={26} /></span>
          <h3>{folder.name}</h3>
          <p>{folder.count} documents</p>
          <small>{folder.date}</small>
        </article>
      ))}
    </div>
  )
}

function FolderFilesView({ files, folder, onBack, onDeleteFile, onOpenFile, onShareFile, onToggleFavorite, onToggleFileMenu, openFileMenuId }) {
  return (
    <section className="folder-files-view">
      <header className="folder-files-header">
        <button className="text-link" onClick={onBack} type="button">← Back to folders</button>
        <div>
          <span><StudyHubIcon name="folder" size={26} /></span>
          <div><h2>{folder.name}</h2><p>{files.length} files · {folder.date}</p></div>
        </div>
      </header>
      <DocumentList
        files={files}
        onDeleteFile={onDeleteFile}
        onOpenFile={onOpenFile}
        onShareFile={onShareFile}
        onToggleFavorite={onToggleFavorite}
        onToggleFileMenu={onToggleFileMenu}
        openFileMenuId={openFileMenuId}
      />
    </section>
  )
}

function DocumentList({ files, onDeleteFile, onOpenFile, onShareFile, onToggleFavorite, onToggleFileMenu, openFileMenuId }) {
  if (!files.length) return <div className="quiz-empty-card">Không có tài liệu</div>
  return (
    <div className="file-list">
      <section>
        <h2>Documents</h2>
        {files.map((file) => (
          <div className="folder-file-row" key={file.id}>
            <FileRow file={file} onClick={() => onOpenFile(file)} onToggleFavorite={onToggleFavorite} />
            <button className="file-menu-trigger" onClick={() => onToggleFileMenu(openFileMenuId === file.id ? null : file.id)} type="button">...</button>
            {openFileMenuId === file.id && (
              <div className="file-action-menu">
                <button onClick={() => onShareFile(file)} type="button">Chia sẻ</button>
                <button className="is-danger" onClick={() => onDeleteFile(file)} type="button">Xóa file</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

function LibraryRail({ activeTab, counts, onNavigate, onTabChange }) {
  return (
    <aside className="library-rail">
      <button className="new-session" onClick={() => onNavigate('new-study-session')} type="button">
        <StudyHubIcon name="plus" size={18} /> New Study Session
      </button>
      <nav className="library-tabs">
        {libraryTabs.map((tab) => (
          <button className={activeTab === tab.id ? 'is-active' : ''} key={tab.id} onClick={() => onTabChange(tab.id)} type="button">
            <StudyHubIcon name={tab.icon} size={20} />
            <span>{tab.label}</span>
            <small>{counts[tab.id] ?? 0}</small>
          </button>
        ))}
      </nav>
      <div className="upgrade-card">
        <span><StudyHubIcon name="book" size={24} /></span>
        <p>Upgrade for more features</p>
        <button onClick={() => onNavigate('pricing')} type="button">Upgrade</button>
      </div>
    </aside>
  )
}

function FileRow({ file, onClick, onToggleFavorite }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  return (
    <div className="file-row" onClick={onClick} onKeyDown={handleKeyDown} role="button" tabIndex={0}>
      <span className="file-row__icon"><StudyHubIcon name="file" size={24} /></span>
      <span className="file-row__title"><strong>{file.name}</strong><small>{file.subject}</small></span>
      <span className="file-row__badges">
        {file.public && <Badge tone="green">Public</Badge>}
        <Badge tone="purple">{file.kind}</Badge>
        <small>{file.date}</small>
        <button
          aria-label={file.favorite ? `Bỏ yêu thích ${file.name}` : `Yêu thích ${file.name}`}
          className={`icon-button file-favorite-button ${file.favorite ? 'is-active' : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite(file)
          }}
          type="button"
        >
          <StudyHubIcon name="heart" size={18} />
        </button>
      </span>
    </div>
  )
}

function ShareDocumentModal({ file, loading, onClose, onSave }) {
  const [copied, setCopied] = useState(false)
  const [selectedVisibility, setSelectedVisibility] = useState('PUBLIC')
  const shareUrl = `${window.location.origin}${fillRoute(ROUTES.DOCUMENT_DETAIL, { documentId: file.documentId ?? file.id })}`
  const isPublic = selectedVisibility === 'PUBLIC'
  const accessIcon = isPublic ? 'globe' : 'lock'
  const accessTitle = isPublic ? 'Bất kỳ ai có đường liên kết' : 'Hạn chế'
  const accessDescription = isPublic
    ? 'Bất kỳ ai có kết nối Internet và có đường liên kết này đều có thể xem'
    : 'Chỉ những người được thêm mới có thể mở'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="share-document-modal">
        <header>
          <h2>Chia sẻ tài liệu</h2>
          <button aria-label="Đóng" onClick={onClose} type="button"><StudyHubIcon name="close" size={18} /></button>
        </header>

        <div className="share-document-card">
          <div>
            <Badge tone="blue">{file.subject?.split(',')[0] || file.kind}</Badge>
            <Badge>{file.kind}</Badge>
          </div>
          <strong>{file.name}</strong>
        </div>

        <label className="share-link-field">
          Link tài liệu
          <div>
            <input readOnly value={shareUrl} />
            <button onClick={handleCopy} type="button">
              <StudyHubIcon name="card" size={16} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </label>

        <span className="share-access-label">Quyền truy cập chung</span>
        <label className={`share-access ${isPublic ? 'is-public' : ''}`}>
          <span><StudyHubIcon name={accessIcon} size={18} /></span>
          <div>
            <strong>
              {accessTitle}
              <StudyHubIcon name="chevron" size={14} />
            </strong>
            <small>{accessDescription}</small>
          </div>
          <select
            aria-label="Quyền truy cập chung"
            disabled={loading}
            onChange={(event) => setSelectedVisibility(event.target.value)}
            value={selectedVisibility}
          >
            <option value="PRIVATE">Hạn chế</option>
            <option value="PUBLIC">Bất kỳ ai có đường liên kết</option>
          </select>
        </label>

        <button className="share-publish-button" disabled={loading} onClick={() => onSave(selectedVisibility)} type="button">
          {loading ? 'Đang lưu...' : selectedVisibility === 'PUBLIC' ? 'Đăng diễn đàn' : 'Chuyển về riêng tư'}
        </button>
        <button className="share-close-button" disabled={loading} onClick={onClose} type="button">Đóng</button>
      </section>
    </div>
  )
}

function mapFolder(folder) {
  return {
    id: folder.id,
    name: folder.folderName,
    parentFolderId: folder.parentFolderId,
    count: folder.documents?.length ?? 0,
    date: formatApiDate(folder.createdAt),
  }
}

function mapDocument(document) {
  return {
    id: document.id,
    documentId: document.id,
    name: document.title || document.fileName,
    attachmentName: document.fileName,
    subject: document.description || document.tags?.join(', ') || 'Tài liệu cá nhân',
    kind: document.fileType?.toLowerCase() || 'document',
    date: formatApiDate(document.updatedAt || document.createdAt),
    visibility: document.visibility,
    public: document.visibility === 'PUBLIC',
    favorite: Boolean(document.favorite),
    fileUrl: document.fileUrl,
    sizeLabel: formatFileSize(document.fileSize),
  }
}

function formatApiDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value))
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** unitIndex)).toFixed(unitIndex ? 1 : 0)} ${units[unitIndex]}`
}
