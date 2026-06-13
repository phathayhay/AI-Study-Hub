import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { libraryTabs } from '../../packages/mooc-data'
import {
  createFolder,
  deleteFolder,
  getFolderDetails,
  getRootFolders,
  renameFolder,
} from '../../services/folderService'
import { deleteDocument, getMyDocuments } from '../../services/documentService'

export function LibraryPage({ activeTab, onNavigate, onOpenFile, onTabChange }) {
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [folders, setFolders] = useState([])
  const [documents, setDocuments] = useState([])
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null)
  const [openFileMenuId, setOpenFileMenuId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadLibrary() {
      setLoading(true)
      setError('')
      try {
        const [folderData, documentData] = await Promise.all([
          getRootFolders(),
          getMyDocuments(),
        ])
        if (!active) return
        setFolders(folderData.map(mapFolder))
        setDocuments(documentData.map(mapDocument))
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadLibrary()
    return () => {
      active = false
    }
  }, [])

  const visibleDocuments = useMemo(() => {
    if (activeTab === 'shared') return documents.filter((document) => document.public)
    if (activeTab === 'favorites') return []
    if (activeTab === 'recent') return documents
    return documents.slice(0, 4)
  }, [activeTab, documents])

  const handleAddFolder = async () => {
    const folderName = window.prompt('Nhap ten thu muc moi')?.trim()
    if (!folderName) return

    await runRequest(async () => {
      const folder = mapFolder(await createFolder(folderName))
      setFolders((current) => [...current, folder])
      setSelectedFolder(null)
      onTabChange('folders')
    })
  }

  const handleRenameFolder = async (folder) => {
    const folderName = window.prompt('Nhap ten thu muc moi', folder.name)?.trim()
    if (!folderName) return

    await runRequest(async () => {
      const updated = mapFolder(await renameFolder(folder.id, folderName, folder.parentFolderId))
      setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, ...updated } : item))
      setSelectedFolder((current) => current?.id === folder.id ? { ...current, ...updated } : current)
      setOpenFolderMenuId(null)
    })
  }

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Xoa thu muc "${folder.name}" va cac thu muc con?`)) return

    await runRequest(async () => {
      await deleteFolder(folder.id)
      setFolders((current) => current.filter((item) => item.id !== folder.id))
      if (selectedFolder?.id === folder.id) setSelectedFolder(null)
      setOpenFolderMenuId(null)
    })
  }

  const handleOpenFolder = async (folder) => {
    await runRequest(async () => {
      const details = await getFolderDetails(folder.id)
      setSelectedFolder({
        ...mapFolder(details),
        documents: (details.documents ?? []).map(mapDocument),
        subfolders: (details.subfolders ?? []).map(mapFolder),
      })
    })
  }

  const handleDeleteDocument = async (file) => {
    if (!window.confirm(`Xoa tai lieu "${file.name}"?`)) return

    await runRequest(async () => {
      await deleteDocument(file.id)
      setDocuments((current) => current.filter((item) => item.id !== file.id))
      setSelectedFolder((current) => current
        ? { ...current, documents: current.documents.filter((item) => item.id !== file.id) }
        : current)
      setOpenFileMenuId(null)
    })
  }

  const runRequest = async (request) => {
    setError('')
    try {
      await request()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <div className="library-shell">
      <LibraryRail activeTab={activeTab} onNavigate={onNavigate} onTabChange={onTabChange} />
      <main className="library-main">
        <div className="library-header">
          <div><h1>Xin chao, <span>A!</span></h1></div>
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

        {loading && <p className="api-status">Dang tai thu vien...</p>}
        {error && <p className="api-status api-status--error">{error}</p>}

        {activeTab === 'folders' ? (
          selectedFolder ? (
            <FolderFilesView
              files={selectedFolder.documents ?? []}
              folder={selectedFolder}
              onBack={() => setSelectedFolder(null)}
              onDeleteFile={handleDeleteDocument}
              onOpenFile={onOpenFile}
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
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
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
        <article
          className="library-folder"
          key={folder.id}
          onClick={() => onSelectFolder(folder)}
          onKeyDown={(event) => event.key === 'Enter' && onSelectFolder(folder)}
          role="button"
          tabIndex={0}
        >
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
              <button onClick={() => onRenameFolder(folder)} type="button">Doi ten</button>
              <button className="is-danger" onClick={() => onDeleteFolder(folder)} type="button">Xoa folder</button>
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

function FolderFilesView({ files, folder, onBack, onDeleteFile, onOpenFile, onToggleFileMenu, openFileMenuId }) {
  return (
    <section className="folder-files-view">
      <header className="folder-files-header">
        <button className="text-link" onClick={onBack} type="button">&lt;- Back to folders</button>
        <div>
          <span><StudyHubIcon name="folder" size={26} /></span>
          <div>
            <h2>{folder.name}</h2>
            <p>{files.length} files - {folder.date}</p>
          </div>
        </div>
      </header>
      <DocumentList
        files={files}
        onDeleteFile={onDeleteFile}
        onOpenFile={onOpenFile}
        onToggleFileMenu={onToggleFileMenu}
        openFileMenuId={openFileMenuId}
      />
    </section>
  )
}

function DocumentList({ files, onDeleteFile, onOpenFile, onToggleFileMenu, openFileMenuId }) {
  if (!files.length) {
    return <div className="quiz-empty-card">Khong co tai lieu</div>
  }

  return (
    <div className="file-list">
      <section>
        <h2>Documents</h2>
        {files.map((file) => (
          <div className="folder-file-row" key={file.id}>
            <FileRow file={file} onClick={() => onOpenFile(file)} />
            <button
              className="file-menu-trigger"
              onClick={() => onToggleFileMenu(openFileMenuId === file.id ? null : file.id)}
              type="button"
            >
              ...
            </button>
            {openFileMenuId === file.id && (
              <div className="file-action-menu">
                <button className="is-danger" onClick={() => onDeleteFile(file)} type="button">Xoa file</button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}

function LibraryRail({ activeTab, onNavigate, onTabChange }) {
  return (
    <aside className="library-rail">
      <button className="new-session" onClick={() => onNavigate('new-study-session')} type="button">
        <StudyHubIcon name="plus" size={18} />
        New Study Session
      </button>
      <nav className="library-tabs">
        {libraryTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? 'is-active' : ''}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            <StudyHubIcon name={tab.icon} size={20} />
            <span>{tab.label}</span>
            {tab.count && <small>{tab.count}</small>}
          </button>
        ))}
      </nav>
      <div className="upgrade-card">
        <span><StudyHubIcon name="book" size={24} /></span>
        <p>Upgrade for more features</p>
        <button onClick={() => onNavigate('pricing')} type="button">Upgrade</button>
      </div>
      <button className="collapse-button" type="button">&lt;&lt;</button>
    </aside>
  )
}

function FileRow({ file, onClick }) {
  return (
    <button className="file-row" onClick={onClick} type="button">
      <span className="file-row__icon"><StudyHubIcon name="file" size={24} /></span>
      <span className="file-row__title">
        <strong>{file.name}</strong>
        <small>{file.subject}</small>
      </span>
      <span className="file-row__badges">
        {file.public && <Badge tone="green">Public</Badge>}
        <Badge tone="purple">{file.kind}</Badge>
        <small>{file.date}</small>
      </span>
    </button>
  )
}

function mapFolder(folder) {
  return {
    id: folder.id,
    name: folder.folderName,
    parentFolderId: folder.parentFolderId,
    count: folder.documents?.length ?? 0,
    date: `Created ${formatApiDate(folder.createdAt)}`,
  }
}

function mapDocument(document) {
  return {
    id: document.id,
    name: document.title || document.fileName,
    attachmentName: document.fileName,
    subject: document.description || document.tags?.join(', ') || 'Tai lieu ca nhan',
    kind: document.fileType?.toLowerCase() || 'document',
    date: formatApiDate(document.updatedAt || document.createdAt),
    public: document.visibility === 'PUBLIC',
    fileUrl: document.fileUrl,
    sizeLabel: formatFileSize(document.fileSize),
    document,
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
