import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { libraryFiles, libraryFolders } from '../../data/studyHubData'
import { libraryTabs } from './config'
import { getMyDocuments } from '../../features/documents/documentService'

function mapDoc(doc) {
  return {
    id: doc.id,
    name: doc.title || doc.fileName || 'Untitled',
    subject: doc.fileType || 'Document',
    kind: 'document',
    group: 'This Week',
    date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '',
    shared: doc.visibility === 'PUBLIC',
    public: doc.visibility === 'PUBLIC',
    favorite: false,
  }
}

const folderFileMap = {
  1: [libraryFiles[1], libraryFiles[3], libraryFiles[4], libraryFiles[6], libraryFiles[8]],
  2: [libraryFiles[2], libraryFiles[5], libraryFiles[8], libraryFiles[0], libraryFiles[3], libraryFiles[4], libraryFiles[6], libraryFiles[7]],
  3: [libraryFiles[0], libraryFiles[2], libraryFiles[7]],
}

export function LibraryPage({ activeTab, onNavigate, onOpenFile, onTabChange }) {
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [folders, setFolders] = useState(libraryFolders)
  const [filesById, setFilesById] = useState(() => Object.fromEntries(libraryFiles.map((file) => [file.id, file])))
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null)
  const [folderFiles, setFolderFiles] = useState(folderFileMap)
  const [openFileMenuId, setOpenFileMenuId] = useState(null)
  const [apiDocs, setApiDocs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyDocuments().then((res) => {
      const list = Array.isArray(res) ? res : res?.data || []
      setApiDocs(list.map(mapDoc))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const managedFiles = useMemo(() => {
    const merged = [...apiDocs, ...Object.values(filesById)]
    const seen = new Set()
    return merged.filter((f) => { if (seen.has(f.id)) return false; seen.add(f.id); return true })
  }, [apiDocs, filesById])
  const files = useMemo(() => {
    if (activeTab === 'shared') return managedFiles.filter((file) => file.shared)
    if (activeTab === 'favorites') return managedFiles.filter((file) => file.favorite)
    if (activeTab === 'recent') return managedFiles
    return managedFiles.slice(0, 4)
  }, [activeTab, managedFiles])

  const handleAddFolder = () => {
    const nextIndex = folders.length + 1
    const newFolder = {
      id: Date.now(),
      name: `New Folder ${nextIndex}`,
      count: 0,
      date: 'Created Jun 9, 2026',
    }

    setFolders((currentFolders) => [...currentFolders, newFolder])
    setSelectedFolder(null)
    onTabChange('folders')
  }

  const handleRenameFolder = (folder) => {
    const nextName = window.prompt('Nhập tên thư mục mới', folder.name)?.trim()
    if (!nextName) return
    setFolders((currentFolders) => currentFolders.map((currentFolder) => (
      currentFolder.id === folder.id ? { ...currentFolder, name: nextName } : currentFolder
    )))
    setOpenFolderMenuId(null)
  }

  const handleDeleteFolder = (folder) => {
    setFolders((currentFolders) => currentFolders.filter((currentFolder) => currentFolder.id !== folder.id))
    setFolderFiles((currentFiles) => {
      const nextFiles = { ...currentFiles }
      delete nextFiles[folder.id]
      return nextFiles
    })
    if (selectedFolder?.id === folder.id) setSelectedFolder(null)
    setOpenFolderMenuId(null)
  }

  const handleRenameFolderFile = (_folder, file) => {
    const nextName = window.prompt('Nhập tên file mới', file.name)?.trim()
    if (!nextName) return
    setFilesById((currentFiles) => ({
      ...currentFiles,
      [file.id]: { ...currentFiles[file.id], name: nextName },
    }))
    setFolderFiles((currentFiles) => Object.fromEntries(
      Object.entries(currentFiles).map(([folderId, folderFilesValue]) => [
        folderId,
        folderFilesValue.map((currentFile) => (
          currentFile.id === file.id ? { ...currentFile, name: nextName } : currentFile
        )),
      ]),
    ))
    setOpenFileMenuId(null)
  }

  const handleDeleteFolderFile = (_folder, file) => {
    setFilesById((currentFiles) => {
      const nextFiles = { ...currentFiles }
      delete nextFiles[file.id]
      return nextFiles
    })
    setFolderFiles((currentFiles) => Object.fromEntries(
      Object.entries(currentFiles).map(([folderId, folderFilesValue]) => [
        folderId,
        folderFilesValue.filter((currentFile) => currentFile.id !== file.id),
      ]),
    ))
    setOpenFileMenuId(null)
  }

  const handleRenameLibraryFile = (file) => {
    const nextName = window.prompt('Nhập tên file mới', file.name)?.trim()
    if (!nextName) return
    setFilesById((currentFiles) => ({
      ...currentFiles,
      [file.id]: { ...currentFiles[file.id], name: nextName },
    }))
    setFolderFiles((currentFiles) => Object.fromEntries(
      Object.entries(currentFiles).map(([folderId, folderFilesValue]) => [
        folderId,
        folderFilesValue.map((currentFile) => (
          currentFile.id === file.id ? { ...currentFile, name: nextName } : currentFile
        )),
      ]),
    ))
    setOpenFileMenuId(null)
  }

  const handleDeleteLibraryFile = (file) => {
    setFilesById((currentFiles) => {
      const nextFiles = { ...currentFiles }
      delete nextFiles[file.id]
      return nextFiles
    })
    setFolderFiles((currentFiles) => Object.fromEntries(
      Object.entries(currentFiles).map(([folderId, folderFilesValue]) => [
        folderId,
        folderFilesValue.filter((currentFile) => currentFile.id !== file.id),
      ]),
    ))
    setOpenFileMenuId(null)
  }

  return (
    <div className="library-shell">
      <LibraryRail activeTab={activeTab} onNavigate={onNavigate} onTabChange={onTabChange} />
      <main className="library-main">
        <div className="library-header">
          <div>
            <h1>Xin chào, <span>A!</span></h1>
          </div>
          <div className="library-actions">
            <label>Sort: <select><option>Last accessed</option></select></label>
            <button className="square-button" type="button"><StudyHubIcon name="upload" size={18} /></button>
            <button className="primary-action" onClick={handleAddFolder} type="button"><StudyHubIcon name="plus" size={18} /> Folder</button>
          </div>
        </div>
        <div className="search-line library-search">
          <StudyHubIcon name="search" size={18} />
          <input placeholder="Search by title or content type..." />
        </div>

        {activeTab === 'folders' ? (
          selectedFolder ? (
            <FolderFilesView
              files={folderFiles[selectedFolder.id] ?? []}
              folder={selectedFolder}
              onBack={() => setSelectedFolder(null)}
              onDeleteFile={handleDeleteFolderFile}
              onRenameFile={handleRenameFolderFile}
              onOpenFile={onOpenFile}
              onToggleFileMenu={setOpenFileMenuId}
              openFileMenuId={openFileMenuId}
            />
          ) : (
            <FolderGrid
              folders={folders}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
              onSelectFolder={setSelectedFolder}
              onToggleMenu={setOpenFolderMenuId}
              openMenuId={openFolderMenuId}
            />
          )
        ) : activeTab === 'shared' ? (
          <SharedLibraryFiles
            allFiles={managedFiles}
            onDeleteFile={handleDeleteLibraryFile}
            onOpenFile={onOpenFile}
            onRenameFile={handleRenameLibraryFile}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
          />
        ) : (
          <GroupedFiles
            files={files}
            onDeleteFile={handleDeleteLibraryFile}
            onOpenFile={onOpenFile}
            onRenameFile={handleRenameLibraryFile}
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
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSelectFolder(folder)
          }}
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
            ⋯
          </button>
          {openMenuId === folder.id && (
            <div className="folder-action-menu" onClick={(event) => event.stopPropagation()}>
              <button onClick={() => onRenameFolder(folder)} type="button">Chỉnh sửa</button>
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

function FolderFilesView({
  files,
  folder,
  onBack,
  onDeleteFile,
  onOpenFile,
  onRenameFile,
  onToggleFileMenu,
  openFileMenuId,
}) {
  return (
    <section className="folder-files-view">
      <header className="folder-files-header">
        <button className="text-link" onClick={onBack} type="button">← Back to folders</button>
        <div>
          <span><StudyHubIcon name="folder" size={26} /></span>
          <div>
            <h2>{folder.name}</h2>
            <p>{files.length} files · {folder.date}</p>
          </div>
        </div>
      </header>
      <div className="file-list">
        <section>
          <h2>Files in this folder</h2>
          {files.map((file) => (
            <FolderFileRow
              file={file}
              folder={folder}
              key={file.id}
              onDeleteFile={onDeleteFile}
              onOpenFile={onOpenFile}
              onRenameFile={onRenameFile}
              onToggleFileMenu={onToggleFileMenu}
              openFileMenuId={openFileMenuId}
            />
          ))}
        </section>
      </div>
    </section>
  )
}

function FolderFileRow({ file, folder, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  return (
    <div className="folder-file-row">
      <FileRow file={file} onClick={() => onOpenFile(file)} />
      <button
        className="file-menu-trigger"
        onClick={() => onToggleFileMenu(openFileMenuId === file.id ? null : file.id)}
        type="button"
      >
        ⋯
      </button>
      {openFileMenuId === file.id && (
        <div className="file-action-menu">
          <button onClick={() => onRenameFile(folder, file)} type="button">Chỉnh sửa</button>
          <button className="is-danger" onClick={() => onDeleteFile(folder, file)} type="button">Xóa file</button>
        </div>
      )}
    </div>
  )
}

function ActionableFileRow({ file, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  return (
    <div className="folder-file-row">
      <FileRow file={file} onClick={() => onOpenFile(file)} />
      <button
        className="file-menu-trigger"
        onClick={() => onToggleFileMenu(openFileMenuId === file.id ? null : file.id)}
        type="button"
      >
        ⋯
      </button>
      {openFileMenuId === file.id && (
        <div className="file-action-menu">
          <button onClick={() => onRenameFile(file)} type="button">Chỉnh sửa</button>
          <button className="is-danger" onClick={() => onDeleteFile(file)} type="button">Xóa file</button>
        </div>
      )}
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

function GroupedFiles({ files, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  const groups = ['Yesterday', 'This Week']
  return (
    <div className="file-list">
      {groups.map((group) => {
        const groupFiles = files.filter((file) => file.group === group)
        if (!groupFiles.length) return null
        return (
          <section key={group}>
            <h2>{group}</h2>
            {groupFiles.map((file) => (
              <ActionableFileRow
                file={file}
                key={file.id}
                onDeleteFile={onDeleteFile}
                onOpenFile={onOpenFile}
                onRenameFile={onRenameFile}
                onToggleFileMenu={onToggleFileMenu}
                openFileMenuId={openFileMenuId}
              />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function SharedLibraryFiles({ allFiles, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  const [shareScope, setShareScope] = useState('public')
  const files = allFiles.filter((file) => (shareScope === 'public' ? file.public : file.shared))

  return (
    <div className="file-list">
      <div className="share-tabs">
        <button
          className={shareScope === 'shared' ? 'is-active' : ''}
          onClick={() => setShareScope('shared')}
          type="button"
        >
          <StudyHubIcon name="users" size={15} /> Shared <small>2</small>
        </button>
        <button
          className={shareScope === 'public' ? 'is-active' : ''}
          onClick={() => setShareScope('public')}
          type="button"
        >
          <StudyHubIcon name="globe" size={15} /> Public <small>3</small>
        </button>
      </div>
      <section>
        <h2>This Week</h2>
        {files.map((file) => (
          <ActionableFileRow
            file={file}
            key={file.id}
            onDeleteFile={onDeleteFile}
            onOpenFile={onOpenFile}
            onRenameFile={onRenameFile}
            onToggleFileMenu={onToggleFileMenu}
            openFileMenuId={openFileMenuId}
          />
        ))}
      </section>
    </div>
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
        {file.shared && <Badge tone="blue">Shared</Badge>}
        {file.public && <Badge tone="green">Public</Badge>}
        <Badge tone="purple">{file.kind}</Badge>
        <small>{file.date}</small>
      </span>
    </button>
  )
}
