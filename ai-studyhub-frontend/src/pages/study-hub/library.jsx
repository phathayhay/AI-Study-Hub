import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { libraryFiles, libraryFolders } from '../../data/studyHubData'
import { libraryTabs } from './config'
import { getMyDocuments, getSharedDocuments } from '../../features/documents/documentService'
import { getRootFolders, createFolder, renameFolder, deleteFolder } from '../../features/folders/folderService'

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
    fileUrl: doc.fileUrl || '',
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
  const [apiSharedDocs, setApiSharedDocs] = useState([])
  const [apiFolders, setApiFolders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getMyDocuments().catch(() => ({ data: [] })),
      getSharedDocuments().catch(() => ({ data: [] })),
      getRootFolders().catch(() => ({ data: [] }))
    ]).then(([myRes, sharedRes, folderRes]) => {
      const myList = Array.isArray(myRes) ? myRes : (Array.isArray(myRes?.data) ? myRes.data : myRes?.data?.content || [])
      const sharedList = Array.isArray(sharedRes) ? sharedRes : (Array.isArray(sharedRes?.data) ? sharedRes.data : sharedRes?.data?.content || [])
      const folderList = Array.isArray(folderRes) ? folderRes : (Array.isArray(folderRes?.data) ? folderRes.data : folderRes?.data?.content || [])
      
      setApiDocs(myList.map(mapDoc))
      setApiSharedDocs(sharedList.map(mapDoc))
      
      const mappedFolders = folderList.map(f => ({
        id: f.id,
        name: f.folderName || f.name || 'Untitled Folder',
        count: f.documentCount || 0,
        date: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '',
        type: 'folder'
      }))
      setApiFolders(mappedFolders)
    }).finally(() => setLoading(false))
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
    <div style={{ flex: 1, backgroundColor: '#f8fafc', overflowY: 'auto' }}>
      <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
            Hello, <span style={{ fontWeight: 700 }}>Anh!</span>
          </h1>
          
          <div style={{ flex: 1, maxWidth: '600px', display: 'flex', alignItems: 'center', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 16px', height: '40px' }}>
            <input 
              placeholder="Search by title or content type..." 
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#0f172a' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', whiteSpace: 'nowrap' }}>
            <label style={{ fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Sort: <select style={{ border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: 500, fontSize: '14px', cursor: 'pointer', outline: 'none' }}><option>Last accessed</option></select>
            </label>
            <button style={{ height: '36px', padding: '0 16px', backgroundColor: '#fff', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: '8px', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={handleAddFolder} type="button">
              <StudyHubIcon name="plus" size={16} /> Folder
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 8px' }}>Today</h3>
              {[...apiFolders, ...folders].map((folder) => (
                <ActionableFileRow
                  key={folder.id}
                  file={folder}
                  isFolder={true}
                  onDeleteFile={handleDeleteFolder}
                  onOpenFile={() => setSelectedFolder(folder)}
                  onRenameFile={handleRenameFolder}
                  onToggleFileMenu={setOpenFolderMenuId}
                  openFileMenuId={openFolderMenuId}
                />
              ))}
              {apiFolders.length === 0 && folders.length === 0 && (
                <div style={{ padding: '64px', textAlign: 'center', backgroundColor: '#f5f3ff', borderRadius: '16px', color: '#64748b', fontSize: '15px' }}>
                  No items found
                </div>
              )}
            </div>
          )
        ) : activeTab === 'shared' ? (
          <SharedLibraryFiles
            allFiles={apiSharedDocs}
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
        </div>
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
    <section>
      <header style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#fff', padding: '16px 24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex' }}><StudyHubIcon name="arrow-left" size={20} /></button>
        <StudyHubIcon name="folder" size={20} style={{ color: '#818cf8' }} />
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#818cf8', margin: 0 }}>{folder.name}</h2>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: '0 0 4px 8px' }}>Today</h3>
        {/* Mock folder self-reference to match screenshot */}
        <ActionableFileRow
          file={{ id: folder.id + '_self', name: folder.name, type: 'folder', time: '02:16' }}
          isFolder={true}
          onDeleteFile={() => {}}
          onOpenFile={() => {}}
          onRenameFile={() => {}}
          onToggleFileMenu={() => {}}
          openFileMenuId={null}
        />
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
      </div>
    </section>
  )
}

function FolderFileRow({ file, folder, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  return (
    <ActionableFileRow 
      file={file} 
      onDeleteFile={(f) => onDeleteFile(folder, f)} 
      onOpenFile={onOpenFile} 
      onRenameFile={(f) => onRenameFile(folder, f)} 
      onToggleFileMenu={onToggleFileMenu} 
      openFileMenuId={openFileMenuId} 
    />
  )
}

function ActionableFileRow({ file, isFolder, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
      <FileRow file={file} isFolder={isFolder} onClick={() => onOpenFile(file)} />
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFileMenu(openFileMenuId === file.id ? null : file.id) }}
        type="button"
        style={{ position: 'absolute', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}
      >
        <StudyHubIcon name="more-vertical" size={20} />
      </button>
      {openFileMenuId === file.id && (
        <div className="file-action-menu" style={{ position: 'absolute', right: '16px', top: '100%', zIndex: 10, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: '4px', display: 'flex', flexDirection: 'column', minWidth: '120px' }}>
          <button onClick={() => onRenameFile(file)} type="button" style={{ padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', borderRadius: '4px' }}>Chỉnh sửa</button>
          <button onClick={() => onDeleteFile(file)} type="button" style={{ padding: '8px 12px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', color: '#ef4444' }}>Xóa file</button>
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
  const groups = ['Today', 'Yesterday', 'This Week']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {groups.map((group) => {
        const groupFiles = files.filter((file) => file.group === group)
        if (!groupFiles.length && group !== 'Today') return null
        const displayFiles = group === 'Today' && !groupFiles.length ? files : groupFiles
        
        return (
          <section key={group} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#475569', margin: 0 }}>{group}</h2>
            {displayFiles.map((file) => (
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
  // In the new API structure we pass all shared documents down, or we just render 'No items found' if none.
  const files = allFiles.length > 0 ? allFiles : [];

  return (
    <div className="file-list">
      {files.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', backgroundColor: '#f5f3ff', borderRadius: '16px', color: '#64748b', fontSize: '15px' }}>
          No items found
        </div>
      ) : (
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
      )}
    </div>
  )
}

function FileRow({ file, isFolder, onClick }) {
  const isActualFolder = isFolder || file.type === 'folder' || file.kind === 'folder';
  return (
    <button onClick={onClick} type="button" style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '16px 24px', backgroundColor: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
      <div style={{ color: '#818cf8', marginRight: '16px' }}>
        <StudyHubIcon name={isActualFolder ? 'folder' : 'file'} size={24} />
      </div>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>
        {file.name}
      </span>
      <span style={{ width: '120px', fontSize: '13px', color: '#64748b' }}>
        {isActualFolder ? 'folder' : 'session'}
      </span>
      <span style={{ width: '80px', fontSize: '13px', color: '#64748b', textAlign: 'right', paddingRight: '32px' }}>
        {file.time || '02:00'}
      </span>
    </button>
  )
}
