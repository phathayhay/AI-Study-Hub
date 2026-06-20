import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon, { getFileIconName, getFileIconColor } from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { libraryTabs } from './config'
import { 
  getMyDocuments, 
  getSharedDocuments, 
  deleteDocument,
  getFavoriteDocuments, 
  getHistoryDocuments,
  moveDocument,
  shareDocument,
  updateDocumentVisibility
} from '../../features/documents/documentService'
import { 
  getRootFolders, 
  getFolder,
  createFolder, 
  renameFolder, 
  deleteFolder,
  moveFolder
} from '../../features/folders/folderService'

function getItemGroup(dateStr) {
  if (!dateStr) return 'Older'
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  
  const diffTime = Math.abs(today - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else if (diffDays <= 7) {
    return 'This Week'
  } else {
    return 'Older'
  }
}

function mapDoc(doc) {
  const dateObj = doc.createdAt ? new Date(doc.createdAt) : new Date()
  const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })

  let docName = doc.title || doc.fileName || 'Untitled';
  try {
    const localRenames = JSON.parse(localStorage.getItem('renamedDocs') || '{}');
    if (localRenames[doc.id]) {
      docName = localRenames[doc.id];
    }
  } catch (e) {
    console.error('Failed to parse renamedDocs', e);
  }
  
  return {
    id: doc.id,
    name: docName,
    subject: doc.fileType || 'Document',
    kind: 'document',
    type: 'session',
    group: getItemGroup(doc.createdAt),
    date: displayDate,
    time: displayDate,
    shared: doc.visibility === 'PUBLIC',
    public: doc.visibility === 'PUBLIC',
    visibility: doc.visibility,
    favorite: false,
    fileUrl: doc.fileUrl || '',
    folderId: doc.folderId,
    createdAt: doc.createdAt
  }
}

export function LibraryPage({
  activeTab,
  onNavigate,
  onOpenFile,
  onTabChange,
  user,
  onRemoveRecentItem,
  onPurgeStaleRecent,
  initialFolderId,
  onClearInitialFolderId
}) {
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedFolderDetails, setSelectedFolderDetails] = useState(null)
  const [folderLoading, setFolderLoading] = useState(false)
  const [openFolderMenuId, setOpenFolderMenuId] = useState(null)
  const [openFileMenuId, setOpenFileMenuId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('lastAccessed')
  const [apiDocs, setApiDocs] = useState([])
  const [apiSharedDocs, setApiSharedDocs] = useState([])
  const [apiFavoriteDocs, setApiFavoriteDocs] = useState([])
  const [apiHistoryDocs, setApiHistoryDocs] = useState([])
  const [apiFolders, setApiFolders] = useState([])
  const [loading, setLoading] = useState(true)

  // Pin & Move states
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('pinnedItems')
      return new Set(saved ? JSON.parse(saved) : [])
    } catch (e) {
      return new Set()
    }
  })
  const [moveItem, setMoveItem] = useState(null)
  const [shareItem, setShareItem] = useState(null)

  const loadLibraryData = () => {
    setLoading(true)
    Promise.all([
      getMyDocuments().catch(() => ({ data: [] })),
      getSharedDocuments().catch(() => ({ data: [] })),
      getRootFolders().catch(() => ({ data: [] })),
      getFavoriteDocuments().catch(() => ({ data: [] })),
      getHistoryDocuments().catch(() => ({ data: [] })),
    ]).then(([myRes, sharedRes, folderRes, favRes, histRes]) => {
      const myList = Array.isArray(myRes) ? myRes : (Array.isArray(myRes?.data) ? myRes.data : myRes?.data?.content || [])
      const sharedList = Array.isArray(sharedRes) ? sharedRes : (Array.isArray(sharedRes?.data) ? sharedRes.data : sharedRes?.data?.content || [])
      const folderList = Array.isArray(folderRes) ? folderRes : (Array.isArray(folderRes?.data) ? folderRes.data : folderRes?.data?.content || [])
      const favList = Array.isArray(favRes) ? favRes : (Array.isArray(favRes?.data) ? favRes.data : favRes?.data?.content || [])
      const histList = Array.isArray(histRes) ? histRes : (Array.isArray(histRes?.data) ? histRes.data : histRes?.data?.content || [])
      
      setApiDocs(myList.map(doc => ({ ...mapDoc(doc), favorite: favList.some(f => f.id === doc.id) })))
      setApiSharedDocs(sharedList.map(mapDoc))
      setApiFavoriteDocs(favList.map(doc => ({ ...mapDoc(doc), favorite: true })))
      setApiHistoryDocs(histList.map(mapDoc))
      
      const mappedFolders = folderList.map(f => {
        const dateObj = f.createdAt ? new Date(f.createdAt) : new Date()
        const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        return {
          id: f.id,
          name: f.folderName || f.name || 'Untitled Folder',
          count: f.documents?.length || f.documentCount || 0,
          date: displayDate,
          time: displayDate,
          group: getItemGroup(f.createdAt),
          type: 'folder',
          isFolder: true,
          createdAt: f.createdAt
        }
      })
      setApiFolders(mappedFolders)

      // Purge any stale Recent entries for documents that no longer exist
      const allDocIds = [
        ...myList.map(d => d.id),
        ...sharedList.map(d => d.id),
      ]
      onPurgeStaleRecent?.(allDocIds)
    }).catch(err => {
      console.error('Failed to load library data:', err)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadLibraryData()
  }, [])

  // Reset folder selection when switching tabs (unless we are opening an initial folder)
  useEffect(() => {
    if (!initialFolderId) {
      setSelectedFolder(null)
      setSelectedFolderDetails(null)
    }
  }, [activeTab, initialFolderId])

  useEffect(() => {
    if (initialFolderId) {
      handleSelectFolder({ id: initialFolderId, name: 'Loading...' })
      onClearInitialFolderId?.()
    }
  }, [initialFolderId])

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.file-action-menu') && !e.target.closest('.more-btn')) {
        setOpenFileMenuId(null)
        setOpenFolderMenuId(null)
      }
    }
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder)
    setSelectedFolderDetails(null)
    setFolderLoading(true)
    getFolder(folder.id)
      .then((res) => {
        const data = res?.data || res
        setSelectedFolderDetails({
          id: data.id || folder.id,
          name: data.folderName || data.name || folder.name,
          documents: data.documents || [],
          subfolders: data.subfolders || []
        })
      })
      .catch((err) => {
        console.error(err)
      })
      .finally(() => {
        setFolderLoading(false)
      })
  }

  const handleAddFolder = () => {
    const name = window.prompt('Enter new folder name:')?.trim()
    if (!name) return
    setLoading(true)
    createFolder(name)
      .then(() => {
        loadLibraryData()
        onTabChange('folders')
        window.showToast?.('Folder created successfully', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to create folder', 'error')
      })
  }

  const handleAddSubfolder = (parentFolder) => {
    const name = window.prompt(`Enter subfolder name in "${parentFolder.name}":`)
    if (!name?.trim()) return
    setFolderLoading(true)
    createFolder(name.trim(), parentFolder.id)
      .then(() => {
        handleSelectFolder(parentFolder)
        loadLibraryData()
        window.showToast?.('Subfolder created successfully', 'success')
      })
      .catch((err) => {
        console.error(err)
        setFolderLoading(false)
        window.showToast?.('Failed to create subfolder', 'error')
      })
  }

  const handleTogglePin = (item) => {
    const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
    const key = `${item.id}_${isFolder ? 'folder' : 'document'}`
    setPinnedIds(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        window.showToast?.('Item unpinned successfully', 'success')
      } else {
        next.add(key)
        window.showToast?.('Item pinned successfully', 'success')
      }
      localStorage.setItem('pinnedItems', JSON.stringify([...next]))
      return next
    })
  }

  const handleShareItem = (item) => {
    const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
    if (isFolder) {
      window.showToast?.('Sharing folders is not supported', 'info')
      return
    }
    setShareItem(item)
  }

  const handleRenameItem = (item) => {
    const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
    const nextName = window.prompt(`Enter new ${isFolder ? 'folder' : 'document'} name:`, item.name)?.trim()
    if (!nextName) return

    if (isFolder) {
      setLoading(true)
      renameFolder(item.id, nextName)
        .then(() => {
          loadLibraryData()
          if (selectedFolder && selectedFolder.id === item.id) {
            setSelectedFolder({ ...selectedFolder, name: nextName })
          }
          window.showToast?.('Folder renamed successfully', 'success')
        })
        .catch((err) => {
          console.error(err)
          setLoading(false)
          window.showToast?.('Failed to rename folder', 'error')
        })
    } else {
      try {
        const localRenames = JSON.parse(localStorage.getItem('renamedDocs') || '{}')
        localRenames[item.id] = nextName
        localStorage.setItem('renamedDocs', JSON.stringify(localRenames))
        
        loadLibraryData()
        if (selectedFolder) {
          handleSelectFolder(selectedFolder)
        }
        window.showToast?.('Document renamed successfully', 'success')
      } catch (err) {
        console.error('Failed to rename document locally', err)
        window.showToast?.('Failed to rename document', 'error')
      }
    }
    setOpenFileMenuId(null)
    setOpenFolderMenuId(null)
  }

  const handleDeleteFolder = (folder) => {
    if (!window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) return
    setLoading(true)
    deleteFolder(folder.id)
      .then(() => {
        loadLibraryData()
        onRemoveRecentItem?.(folder.id, 'folder')
        if (selectedFolder?.id === folder.id) {
          setSelectedFolder(null)
          setSelectedFolderDetails(null)
        }
        window.showToast?.('Folder deleted successfully', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to delete folder', 'error')
      })
    setOpenFolderMenuId(null)
  }

  const handleDeleteLibraryFile = (file) => {
    if (!window.confirm(`Are you sure you want to delete the document "${file.name}"?`)) return
    setLoading(true)
    deleteDocument(file.id)
      .then(() => {
        loadLibraryData()
        onRemoveRecentItem?.(file.id)
        if (selectedFolder) {
          handleSelectFolder(selectedFolder)
        }
        window.showToast?.('Document deleted successfully', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to delete document', 'error')
      })
    setOpenFileMenuId(null)
  }

  const handleDeleteFolderFile = (folder, file) => {
    if (!window.confirm(`Are you sure you want to remove the document "${file.name}" from the folder?`)) return
    setLoading(true)
    deleteDocument(file.id)
      .then(() => {
        onRemoveRecentItem?.(file.id)
        handleSelectFolder(folder)
        loadLibraryData()
        window.showToast?.('Document removed successfully', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to remove document from folder', 'error')
      })
    setOpenFileMenuId(null)
  }

  const handleDeleteItem = (item) => {
    const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
    if (isFolder) {
      handleDeleteFolder(item)
    } else {
      if (selectedFolder) {
        handleDeleteFolderFile(selectedFolder, item)
      } else {
        handleDeleteLibraryFile(item)
      }
    }
  }

  const handleConfirmMove = (destFolderId) => {
    if (!moveItem) return
    const isFolder = moveItem.isFolder || moveItem.type === 'folder' || moveItem.kind === 'folder'
    
    if (isFolder && destFolderId === moveItem.id) {
      window.showToast?.('Cannot move folder into itself', 'error')
      return
    }

    setLoading(true)
    const movePromise = isFolder 
      ? moveFolder(moveItem.id, moveItem.name, destFolderId)
      : moveDocument(moveItem.id, destFolderId)

    movePromise
      .then(() => {
        window.showToast?.('Item moved successfully', 'success')
        setMoveItem(null)
        loadLibraryData()
        if (selectedFolder) {
          handleSelectFolder(selectedFolder)
        }
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.('Failed to move item', 'error')
      })
      .finally(() => setLoading(false))
  }

  const handleOpenFile = (item) => {
    if (item.isFolder || item.type === 'folder') {
      handleSelectFolder(item)
    } else {
      const activeFile = {
        id: item.id,
        name: item.name,
        attachmentName: item.name,
        subject: item.subject || 'Document',
        content: '',
        fileUrl: item.fileUrl || '',
        visibility: item.visibility,
      }
      onOpenFile?.(activeFile)
    }
  }

  // Study sessions tab: Combine folders and root documents
  const combinedItems = useMemo(() => {
    const rootDocs = apiDocs.filter(d => !d.folderId)
    const combined = [...apiFolders, ...rootDocs]
    
    return combined.map(item => {
      const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
      const isPinned = pinnedIds.has(`${item.id}_${isFolder ? 'folder' : 'document'}`)
      return {
        ...item,
        group: isPinned ? 'Pinned' : item.group
      }
    }).sort((a, b) => {
      if (a.group === 'Pinned' && b.group !== 'Pinned') return -1
      if (a.group !== 'Pinned' && b.group === 'Pinned') return 1
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      }
    })
  }, [apiDocs, apiFolders, sortBy, pinnedIds])

  const filteredCombinedItems = useMemo(() => {
    return combinedItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [combinedItems, searchQuery])

  const filteredSharedDocs = useMemo(() => {
    return apiSharedDocs.map(item => {
      const isPinned = pinnedIds.has(`${item.id}_document`)
      return { ...item, group: isPinned ? 'Pinned' : item.group }
    }).filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.group === 'Pinned' && b.group !== 'Pinned') return -1
      if (a.group !== 'Pinned' && b.group === 'Pinned') return 1
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiSharedDocs, searchQuery, sortBy, pinnedIds])

  const filteredFavoriteDocs = useMemo(() => {
    return apiFavoriteDocs.map(item => {
      const isPinned = pinnedIds.has(`${item.id}_document`)
      return { ...item, group: isPinned ? 'Pinned' : item.group }
    }).filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.group === 'Pinned' && b.group !== 'Pinned') return -1
      if (a.group !== 'Pinned' && b.group === 'Pinned') return 1
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiFavoriteDocs, searchQuery, sortBy, pinnedIds])

  const filteredHistoryDocs = useMemo(() => {
    return apiHistoryDocs.map(item => {
      const isPinned = pinnedIds.has(`${item.id}_document`)
      return { ...item, group: isPinned ? 'Pinned' : item.group }
    }).filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.group === 'Pinned' && b.group !== 'Pinned') return -1
      if (a.group !== 'Pinned' && b.group === 'Pinned') return 1
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiHistoryDocs, searchQuery, sortBy, pinnedIds])

  const filteredFoldersOnly = useMemo(() => {
    return apiFolders.map(item => {
      const isPinned = pinnedIds.has(`${item.id}_folder`)
      return { ...item, group: isPinned ? 'Pinned' : item.group }
    }).filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.group === 'Pinned' && b.group !== 'Pinned') return -1
      if (a.group !== 'Pinned' && b.group === 'Pinned') return 1
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiFolders, searchQuery, sortBy, pinnedIds])

  const customStyles = `
    .hover-action-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: 6px;
      transition: all 0.15s;
    }
    .hover-action-btn:hover {
      color: #4f46e5;
      background-color: #f0f0fb;
    }
    .file-action-menu button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 8px 14px;
      text-align: left;
      border: none;
      background: transparent;
      font-size: 13.5px;
      cursor: pointer;
      border-radius: 6px;
      color: #374151;
      transition: background 0.15s;
    }
    .file-action-menu button:hover {
      background-color: #f3f4f6;
    }
    .file-action-menu button.danger:hover {
      background-color: #fee2e2;
      color: #ef4444;
    }
  `

  return (
    <div style={{ flex: 1, backgroundColor: '#fff', overflowY: 'auto' }}>
      <style>{customStyles}</style>
      <main style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
            Hello, <span style={{ fontWeight: 700 }}>{user?.fullName || 'Student!'}</span>
          </h1>
          
          <div style={{ flex: 1, maxWidth: '520px', display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 14px', height: '38px', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search by title or content type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13.5px', color: '#0f172a', background: 'transparent' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
            <label style={{ fontSize: '13.5px', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Sort:&nbsp;
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ border: 'none', background: 'transparent', color: '#4f46e5', fontWeight: 600, fontSize: '13.5px', cursor: 'pointer', outline: 'none' }}
              >
                <option value="lastAccessed">Last accessed</option>
                <option value="name">Name</option>
              </select>
            </label>
            {!selectedFolder && (
              <button style={{ height: '34px', padding: '0 14px', backgroundColor: '#fff', color: '#4f46e5', border: '1.5px solid #818cf8', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleAddFolder} type="button">
                <StudyHubIcon name="plus" size={14} /> Folder
              </button>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
            Loading data...
          </div>
        ) : activeTab === 'folders' ? (
          selectedFolder ? (
            <FolderFilesView
              folder={selectedFolderDetails || selectedFolder}
              subfolders={selectedFolderDetails?.subfolders || []}
              files={selectedFolderDetails?.documents || []}
              loading={folderLoading}
              onBack={() => { setSelectedFolder(null); setSelectedFolderDetails(null); }}
              onDeleteFile={handleDeleteItem}
              onRenameFile={handleRenameItem}
              onOpenFile={handleOpenFile}
              onToggleFileMenu={setOpenFileMenuId}
              openFileMenuId={openFileMenuId}
              onSelectSubfolder={handleSelectFolder}
              onAddSubfolder={() => handleAddSubfolder(selectedFolderDetails || selectedFolder)}
              pinnedIds={pinnedIds}
              onPin={handleTogglePin}
              onMove={setMoveItem}
              onShare={handleShareItem}
            />
          ) : (
            <GroupedFolders
              folders={filteredFoldersOnly}
              onDeleteFolder={handleDeleteItem}
              onOpenFolder={handleSelectFolder}
              onRenameFolder={handleRenameItem}
              onToggleFolderMenu={setOpenFolderMenuId}
              openFolderMenuId={openFolderMenuId}
              pinnedIds={pinnedIds}
              onPin={handleTogglePin}
              onMove={setMoveItem}
              onShare={handleShareItem}
            />
          )
        ) : activeTab === 'shared' ? (
          <SharedLibraryFiles
            allFiles={filteredSharedDocs}
            onDeleteFile={handleDeleteItem}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameItem}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
            pinnedIds={pinnedIds}
            onPin={handleTogglePin}
            onMove={setMoveItem}
            onShare={handleShareItem}
          />
        ) : activeTab === 'favorites' ? (
          <SharedLibraryFiles
            allFiles={filteredFavoriteDocs}
            onDeleteFile={handleDeleteItem}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameItem}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
            pinnedIds={pinnedIds}
            onPin={handleTogglePin}
            onMove={setMoveItem}
            onShare={handleShareItem}
          />
        ) : activeTab === 'recent' ? (
          <SharedLibraryFiles
            allFiles={filteredHistoryDocs}
            onDeleteFile={handleDeleteItem}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameItem}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
            pinnedIds={pinnedIds}
            onPin={handleTogglePin}
            onMove={setMoveItem}
            onShare={handleShareItem}
          />
        ) : selectedFolder ? (
          <FolderFilesView
            folder={selectedFolderDetails || selectedFolder}
            subfolders={selectedFolderDetails?.subfolders || []}
            files={selectedFolderDetails?.documents || []}
            loading={folderLoading}
            onBack={() => { setSelectedFolder(null); setSelectedFolderDetails(null); }}
            onDeleteFile={handleDeleteItem}
            onRenameFile={handleRenameItem}
            onOpenFile={handleOpenFile}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
            onSelectSubfolder={handleSelectFolder}
            onAddSubfolder={() => handleAddSubfolder(selectedFolderDetails || selectedFolder)}
            pinnedIds={pinnedIds}
            onPin={handleTogglePin}
            onMove={setMoveItem}
            onShare={handleShareItem}
          />
        ) : (
          <GroupedFiles
            files={filteredCombinedItems}
            onDeleteFile={handleDeleteItem}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameItem}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
            pinnedIds={pinnedIds}
            onPin={handleTogglePin}
            onMove={setMoveItem}
            onShare={handleShareItem}
          />
        )}
        </div>
      </main>

      <MoveModal 
        isOpen={!!moveItem} 
        onClose={() => setMoveItem(null)} 
        item={moveItem} 
        folders={apiFolders} 
        onMove={handleConfirmMove} 
      />

      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem}
        onShare={shareDocument}
        onUpdateVisibility={updateDocumentVisibility}
        onSuccess={() => {
          loadLibraryData()
          if (selectedFolder) {
            handleSelectFolder(selectedFolder)
          }
        }}
      />
    </div>
  )
}

function FolderFilesView({
  folder,
  subfolders = [],
  files = [],
  loading = false,
  onBack,
  onDeleteFile,
  onOpenFile,
  onRenameFile,
  onToggleFileMenu,
  openFileMenuId,
  onSelectSubfolder,
  onAddSubfolder,
  pinnedIds,
  onPin,
  onMove,
  onShare
}) {
  if (loading) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        Loading data...
      </div>
    )
  }

  const combined = [
    ...subfolders.map(sf => {
      const dateObj = sf.createdAt ? new Date(sf.createdAt) : new Date()
      const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      return {
        id: sf.id,
        name: sf.folderName || sf.name || 'Untitled Folder',
        type: 'folder',
        isFolder: true,
        date: displayDate,
        time: displayDate,
        createdAt: sf.createdAt
      }
    }),
    ...files.map(f => mapDoc(f))
  ].map(item => {
    const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
    const isPinned = pinnedIds?.has(`${item.id}_${isFolder ? 'folder' : 'document'}`)
    return {
      ...item,
      group: isPinned ? 'Pinned' : item.group
    }
  })

  // Group items by date
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  const grouped = groups.map(g => ({
    label: g,
    items: combined.filter(item => {
      const grp = item.group
      return grp === g
    })
  })).filter(g => g.items.length > 0)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Breadcrumb header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '13.5px', fontWeight: 500, padding: '4px 0', display: 'flex', alignItems: 'center' }}
        >
          Home
        </button>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#0f172a' }}>{folder.name}</span>
        {onAddSubfolder && (
          <button
            onClick={onAddSubfolder}
            type="button"
            title="Create subfolder"
            style={{ marginLeft: 'auto', height: '32px', padding: '0 12px', backgroundColor: '#fff', color: '#4f46e5', border: '1.5px solid #818cf8', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
          >
            <StudyHubIcon name="plus" size={13} />
            Folder
          </button>
        )}
      </div>

      {/* Content card */}
      <div style={{ border: '1px solid #e8e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
        {combined.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            This folder is empty
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Group header row - lavender like Mindgrasp */}
              <div style={{ backgroundColor: '#f0f0fb', padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.02em' }}>
                {label}
              </div>
              {items.map((item) => {
                const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
                const isPinned = pinnedIds?.has(`${item.id}_${isFolder ? 'folder' : 'document'}`)
                return (
                  <ActionableFileRow
                    key={item.id}
                    file={item}
                    isFolder={isFolder}
                    isPinned={isPinned}
                    onPin={onPin}
                    onMove={onMove}
                    onShare={onShare}
                    onDelete={onDeleteFile}
                    onOpenFile={onOpenFile}
                    onRename={onRenameFile}
                    onToggleFileMenu={onToggleFileMenu}
                    openFileMenuId={openFileMenuId}
                  />
                )
              })}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function ActionableFileRow({ 
  file, 
  isFolder, 
  onDelete, 
  onOpenFile, 
  onRename, 
  onPin, 
  onMove, 
  onShare, 
  onToggleFileMenu, 
  openFileMenuId,
  isPinned
}) {
  const isActualFolder = isFolder || file.type === 'folder' || file.kind === 'folder';
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%', backgroundColor: (hovered || openFileMenuId === file.id) ? '#f4f4fc' : '#fff', transition: 'background 0.15s', borderBottom: '1px solid #f0f0f8' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        if (openFileMenuId === file.id) {
          onToggleFileMenu(null)
        }
      }}
    >
      <FileRow file={file} isFolder={isActualFolder} onClick={() => onOpenFile(file)} hovered={hovered} />
      
      {/* Inline Hover Action Buttons */}
      {hovered && openFileMenuId !== file.id && (
        <div style={{ position: 'absolute', right: '40px', display: 'flex', alignItems: 'center', gap: '2px', backgroundColor: '#f4f4fc', paddingLeft: '8px', zIndex: 10 }}>
          <button 
            className="hover-action-btn" 
            onClick={(e) => { e.stopPropagation(); onPin(file) }} 
            type="button" 
            title={isPinned ? 'Unpin' : 'Pin'} 
            style={isPinned ? { color: '#6366f1', backgroundColor: '#f0f0fb' } : undefined}
          >
            <StudyHubIcon name="pin" size={15} />
          </button>
          <button 
            className="hover-action-btn" 
            onClick={(e) => { e.stopPropagation(); onMove(file) }} 
            type="button" 
            title="Move"
          >
            <StudyHubIcon name="move" size={15} />
          </button>
          <button 
            className="hover-action-btn" 
            onClick={(e) => { e.stopPropagation(); onDelete(file) }} 
            type="button" 
            title="Delete"
          >
            <StudyHubIcon name="trash" size={15} />
          </button>
          {!isActualFolder && (
            <button 
              className="hover-action-btn" 
              onClick={(e) => { e.stopPropagation(); onShare(file) }} 
              type="button" 
              title="Share"
            >
              <StudyHubIcon name="share" size={15} />
            </button>
          )}
          <button 
            className="hover-action-btn" 
            onClick={(e) => { e.stopPropagation(); onRename(file) }} 
            type="button" 
            title="Rename"
          >
            <StudyHubIcon name="edit" size={15} />
          </button>
        </div>
      )}

      {/* Ellipsis Menu Trigger */}
      <button
        className="more-btn"
        onMouseEnter={() => onToggleFileMenu(file.id)}
        onClick={(e) => { e.stopPropagation(); onToggleFileMenu(openFileMenuId === file.id ? null : file.id) }}
        type="button"
        style={{ 
          position: 'absolute', 
          right: '12px', 
          background: 'transparent', 
          border: 'none', 
          color: (hovered || openFileMenuId === file.id) ? '#6366f1' : '#94a3b8', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '6px', 
          borderRadius: '6px', 
          transition: 'color 0.15s',
          zIndex: 11
        }}
      >
        <StudyHubIcon name="more-vertical" size={18} />
      </button>

      {/* Ellipsis Dropdown Menu */}
      {openFileMenuId === file.id && (
        <div className="file-action-menu" style={{ position: 'absolute', right: '12px', top: '100%', zIndex: 20, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', padding: '6px', display: 'flex', flexDirection: 'column', minWidth: '160px' }}>
          <button onClick={() => { onPin(file); onToggleFileMenu(null); }} type="button">
            <StudyHubIcon name="pin" size={14} style={{ color: isPinned ? '#6366f1' : 'inherit' }} /> {isPinned ? 'Unpin' : 'Pin'}
          </button>
          <button onClick={() => { onMove(file); onToggleFileMenu(null); }} type="button">
            <StudyHubIcon name="move" size={14} /> Move
          </button>
          <button className="danger" onClick={() => { onDelete(file); onToggleFileMenu(null); }} type="button">
            <StudyHubIcon name="trash" size={14} /> Delete
          </button>
          {!isActualFolder && (
            <button onClick={() => { onShare(file); onToggleFileMenu(null); }} type="button">
              <StudyHubIcon name="share" size={14} /> Share
            </button>
          )}
          <button onClick={() => { onRename(file); onToggleFileMenu(null); }} type="button">
            <StudyHubIcon name="edit" size={14} /> Rename
          </button>
        </div>
      )}
    </div>
  )
}

function GroupedFiles({ 
  files, 
  onDeleteFile, 
  onOpenFile, 
  onRenameFile, 
  onToggleFileMenu, 
  openFileMenuId,
  pinnedIds,
  onPin,
  onMove,
  onShare
}) {
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #e8e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      {groups.map((group) => {
        const groupFiles = files.filter((file) => file.group === group)
        if (groupFiles.length === 0) return null;
        return (
          <div key={group}>
            {/* Lavender group header — Mindgrasp style */}
            <div style={{ backgroundColor: '#f0f0fb', padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.02em' }}>
              {group}
            </div>
            {groupFiles.map((file) => (
              <ActionableFileRow
                file={file}
                key={file.id}
                isFolder={false}
                isPinned={pinnedIds?.has(`${file.id}_document`)}
                onPin={onPin}
                onMove={onMove}
                onShare={onShare}
                onDelete={onDeleteFile}
                onOpenFile={onOpenFile}
                onRename={onRenameFile}
                onToggleFileMenu={onToggleFileMenu}
                openFileMenuId={openFileMenuId}
              />
            ))}
          </div>
        )
      })}
      {files.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No items found
        </div>
      )}
    </div>
  )
}

function GroupedFolders({ 
  folders, 
  onDeleteFolder, 
  onOpenFolder, 
  onRenameFolder, 
  onToggleFolderMenu, 
  openFolderMenuId,
  pinnedIds,
  onPin,
  onMove,
  onShare
}) {
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #e8e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {groups.map((group) => {
        const groupFolders = folders.filter((folder) => folder.group === group)
        if (groupFolders.length === 0) return null;
        return (
          <div key={group}>
            {/* Lavender group header — Mindgrasp style */}
            <div style={{ backgroundColor: '#f0f0fb', padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.02em' }}>
              {group}
            </div>
            {groupFolders.map((folder) => (
              <ActionableFileRow
                file={folder}
                key={folder.id}
                isFolder={true}
                isPinned={pinnedIds?.has(`${folder.id}_folder`)}
                onPin={onPin}
                onMove={onMove}
                onShare={onShare}
                onDelete={onDeleteFolder}
                onOpenFile={onOpenFolder}
                onRename={onRenameFolder}
                onToggleFileMenu={onToggleFolderMenu}
                openFileMenuId={openFolderMenuId}
              />
            ))}
          </div>
        )
      })}
      {folders.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No folders found
        </div>
      )}
    </div>
  )
}

function SharedLibraryFiles({ 
  allFiles, 
  onDeleteFile, 
  onOpenFile, 
  onRenameFile, 
  onToggleFileMenu, 
  openFileMenuId,
  pinnedIds,
  onPin,
  onMove,
  onShare
}) {
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  const files = allFiles || []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #e8e8f0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff' }}>
      {groups.map((group) => {
        const groupFiles = files.filter((file) => file.group === group)
        if (groupFiles.length === 0) return null;
        return (
          <div key={group}>
            {/* Lavender group header — Mindgrasp style */}
            <div style={{ backgroundColor: '#f0f0fb', padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.02em' }}>
              {group}
            </div>
            {groupFiles.map((file) => (
              <ActionableFileRow
                file={file}
                key={file.id}
                isFolder={false}
                isPinned={pinnedIds?.has(`${file.id}_document`)}
                onPin={onPin}
                onMove={onMove}
                onShare={onShare}
                onDelete={onDeleteFile}
                onOpenFile={onOpenFile}
                onRename={onRenameFile}
                onToggleFileMenu={onToggleFileMenu}
                openFileMenuId={openFileMenuId}
              />
            ))}
          </div>
        )
      })}
      {files.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No items found
        </div>
      )}
    </div>
  )
}

function FileRow({ file, isFolder, onClick, hovered }) {
  const isActualFolder = isFolder || file.type === 'folder' || file.kind === 'folder';
  const fileRef = file.name.includes('.') ? file.name : file.subject
  const iconName = isActualFolder ? 'folder' : getFileIconName(fileRef)
  const iconColor = isActualFolder ? '#818cf8' : getFileIconColor(fileRef)
  
  return (
    <button
      onClick={onClick}
      type="button"
      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '13px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ color: iconColor, marginRight: '14px', flexShrink: 0 }}>
        <StudyHubIcon name={iconName} size={20} />
      </div>
      <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 500, color: '#4f46e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: hovered ? 'underline' : 'none' }}>
        {file.name}
      </span>
      <span style={{ width: '110px', fontSize: '12.5px', color: '#94a3b8', flexShrink: 0 }}>
        {isActualFolder ? 'folder' : 'session'}
      </span>
      <span style={{ width: '110px', fontSize: '12.5px', color: '#94a3b8', textAlign: 'right', paddingRight: '36px', flexShrink: 0, opacity: hovered ? 0 : 1, transition: 'opacity 0.15s' }}>
        {file.time || ''}
      </span>
    </button>
  )
}

function MoveModal({ isOpen, onClose, item, folders = [], onMove }) {
  const [currentFolder, setCurrentFolder] = useState(null)
  const [currentSubfolders, setCurrentSubfolders] = useState([])
  const [loading, setLoading] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState([])

  useEffect(() => {
    if (!isOpen) return
    setCurrentFolder(null)
    setBreadcrumbs([])
    setCurrentSubfolders(folders.filter(f => f.id !== item?.id)) // exclude self
  }, [isOpen, folders, item])

  const navigateToFolder = (folder) => {
    if (folder.id === item?.id) return // cannot move into self
    setLoading(true)
    getFolder(folder.id)
      .then((res) => {
        const data = res?.data || res
        setCurrentFolder(folder)
        setBreadcrumbs(prev => [...prev, folder])
        setCurrentSubfolders((data.subfolders || []).filter(f => f.id !== item?.id))
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.('Unable to load subfolders', 'error')
      })
      .finally(() => setLoading(false))
  }

  const navigateUp = () => {
    const nextBreadcrumbs = [...breadcrumbs]
    nextBreadcrumbs.pop()
    setBreadcrumbs(nextBreadcrumbs)

    if (nextBreadcrumbs.length === 0) {
      setCurrentFolder(null)
      setCurrentSubfolders(folders.filter(f => f.id !== item?.id))
    } else {
      const parentFolder = nextBreadcrumbs[nextBreadcrumbs.length - 1]
      setLoading(true)
      getFolder(parentFolder.id)
        .then((res) => {
          const data = res?.data || res
          setCurrentFolder(parentFolder)
          setCurrentSubfolders((data.subfolders || []).filter(f => f.id !== item?.id))
        })
        .catch((err) => {
          console.error(err)
        })
        .finally(() => setLoading(false))
    }
  }

  if (!isOpen || !item) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', width: '90%', maxWidth: '480px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Move item</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>&times;</button>
        </header>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: '260px', maxHeight: '380px', overflowY: 'auto' }}>
          <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
            Move <strong>{item.name}</strong> to:
          </p>
          
          {/* Path Navigator / Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <button onClick={() => { setCurrentFolder(null); setBreadcrumbs([]); setCurrentSubfolders(folders.filter(f => f.id !== item?.id)); }} style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', fontWeight: currentFolder === null ? 600 : 500, color: currentFolder === null ? '#4f46e5' : '#64748b', cursor: 'pointer' }}>Root</button>
            {breadcrumbs.map((b, index) => (
              <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                <span>&rsaquo;</span>
                <button onClick={() => {
                  const nextB = breadcrumbs.slice(0, index + 1)
                  setBreadcrumbs(nextB)
                  navigateToFolder(b)
                }} style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', fontWeight: index === breadcrumbs.length - 1 ? 600 : 500, color: index === breadcrumbs.length - 1 ? '#4f46e5' : '#64748b', cursor: 'pointer' }}>{b.name || b.folderName}</button>
              </span>
            ))}
          </div>

          {/* Subfolders list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', minHeight: '160px' }}>
            {breadcrumbs.length > 0 && (
              <button onClick={navigateUp} style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', border: 'none', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#4f46e5' }}>
                <span>&larr; Back to parent folder</span>
              </button>
            )}
            
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>Loading subfolders...</div>
            ) : currentSubfolders.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>No subfolders here</div>
            ) : (
              currentSubfolders.map(sub => (
                <button key={sub.id} onClick={() => navigateToFolder(sub)} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', background: '#fff', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'} onMouseLeave={(e) => e.target.style.backgroundColor = '#fff'}>
                  <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>
                  </span>
                  <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>{sub.folderName || sub.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 20px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
          <button onClick={onClose} style={{ height: '36px', padding: '0 16px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onMove(currentFolder?.id || null)} style={{ height: '36px', padding: '0 16px', backgroundColor: '#4f46e5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Move here</button>
        </footer>
      </div>
    </div>
  )
}

function ShareModal({ isOpen, onClose, item, onShare, onUpdateVisibility, onSuccess }) {
  const [email, setEmail] = useState('')
  const [visibility, setVisibility] = useState('PRIVATE')
  const [loading, setLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isOpen || !item) return
    setEmail('')
    setIsCopied(false)
    setVisibility(item.public || item.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE')
  }, [isOpen, item])

  if (!isOpen || !item) return null

  const handleAddPerson = (e) => {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return

    setLoading(true)
    onShare(item.id, trimmedEmail, 'VIEW')
      .then(() => {
        window.showToast?.(`Shared with ${trimmedEmail} successfully`, 'success')
        setEmail('')
        onSuccess?.()
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.(err.message || 'Failed to share document', 'error')
      })
      .finally(() => setLoading(false))
  }

  const handleSaveVisibility = () => {
    setSaveLoading(true)
    onUpdateVisibility(item.id, visibility)
      .then(() => {
        window.showToast?.('Updated visibility successfully', 'success')
        onSuccess?.()
        onClose()
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.(err.message || 'Failed to update visibility', 'error')
      })
      .finally(() => setSaveLoading(false))
  }

  const handleCopyLink = () => {
    const docLink = item.fileUrl || `${window.location.origin}/?route=doc-detail&id=${item.id}`
    navigator.clipboard.writeText(docLink)
      .then(() => {
        setIsCopied(true)
        window.showToast?.('Copied document link to clipboard', 'success')
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.('Failed to copy link', 'error')
      })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', width: '90%', maxWidth: '460px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', gap: '20px', position: 'relative' }}>
        
        {/* Close Button */}
        <button onClick={onClose} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '22px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#4f46e5'} onMouseLeave={(e) => e.target.style.color = '#94a3b8'}>
          &times;
        </button>

        {/* Title */}
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0, paddingRight: '30px', lineHeight: 1.4 }}>
          Share "{item.name}"
        </h3>

        {/* General Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            General access
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Toggle Button Segmented Control */}
            <div style={{ display: 'flex', border: '1.5px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', height: '36px', width: '80px', flexShrink: 0 }}>
              <button 
                type="button" 
                onClick={() => setVisibility('PRIVATE')} 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: visibility === 'PRIVATE' ? '#4f46e5' : '#fff', 
                  color: visibility === 'PRIVATE' ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
                title="Restricted"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </button>
              <button 
                type="button" 
                onClick={() => setVisibility('PUBLIC')} 
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: 'none', 
                  cursor: 'pointer', 
                  backgroundColor: visibility === 'PUBLIC' ? '#4f46e5' : '#fff', 
                  color: visibility === 'PUBLIC' ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s'
                }}
                title="Anyone with the link"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
              </button>
            </div>

            {/* Description Text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                {visibility === 'PUBLIC' ? 'Anyone with the link' : 'Restricted'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {visibility === 'PUBLIC' 
                  ? 'Anyone on the internet with this link can view.' 
                  : 'Only the people you invite can view.'}
              </span>
            </div>
          </div>
        </div>

        {/* Add People */}
        <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Add people
          </label>
          <input
            type="email"
            required
            placeholder="Enter email address to share with"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', height: '40px', padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', outline: 'none', color: '#0f172a', transition: 'border-color 0.2s' }}
            onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <button 
            type="submit" 
            disabled={loading || !email.trim()}
            style={{ width: '100%', height: '38px', backgroundColor: (loading || !email.trim()) ? '#94a3b8' : '#889ab5', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 600, color: '#fff', cursor: (loading || !email.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => { if (!loading && email.trim()) e.target.style.backgroundColor = '#6e829d' }}
            onMouseLeave={(e) => { if (!loading && email.trim()) e.target.style.backgroundColor = '#889ab5' }}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <button 
            type="button" 
            onClick={handleCopyLink}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', background: 'transparent', border: '1.5px solid #6366f1', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#6366f1', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.target.style.backgroundColor = '#f0f2ff' }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            {isCopied ? 'Copied' : 'Copy link'}
          </button>
          
          <button 
            type="button" 
            onClick={handleSaveVisibility}
            disabled={saveLoading}
            style={{ height: '36px', padding: '0 20px', backgroundColor: saveLoading ? '#94a3b8' : '#889ab5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: saveLoading ? 'default' : 'pointer', transition: 'background-color 0.2s' }}
            onMouseEnter={(e) => { if (!saveLoading) e.target.style.backgroundColor = '#6e829d' }}
            onMouseLeave={(e) => { if (!saveLoading) e.target.style.backgroundColor = '#889ab5' }}
          >
            {saveLoading ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  )
}
