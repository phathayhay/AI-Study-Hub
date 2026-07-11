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
  moveFolder,
  updateFolderVisibility
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
    userId: doc.userId,
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
  const [pendingDelete, setPendingDelete] = useState(null)
  const [pendingRenameItem, setPendingRenameItem] = useState(null)

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
          visibility: f.visibility || 'PRIVATE',
          public: f.visibility === 'PUBLIC',
          publishReady: f.publishReady,
          publishBlockedReason: f.publishBlockedReason,
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
    if (!user?.id) {
      setApiDocs([])
      setApiSharedDocs([])
      setApiFavoriteDocs([])
      setApiHistoryDocs([])
      setApiFolders([])
      setLoading(false)
      return
    }

    loadLibraryData()
  }, [user?.id])

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
          subfolders: data.subfolders || [],
          visibility: data.visibility || folder.visibility || 'PRIVATE',
          public: data.visibility === 'PUBLIC',
          publishReady: data.publishReady,
          publishBlockedReason: data.publishBlockedReason
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

    setPendingRenameItem({ ...item, isFolder })
    setOpenFileMenuId(null)
    setOpenFolderMenuId(null)
  }

  const handleConfirmRenameItem = (nextName) => {
    if (!pendingRenameItem?.id || !nextName) return

    if (!pendingRenameItem.isFolder) {
      try {
        const localRenames = JSON.parse(localStorage.getItem('renamedDocs') || '{}')
        localRenames[pendingRenameItem.id] = nextName
        localStorage.setItem('renamedDocs', JSON.stringify(localRenames))

        loadLibraryData()
        if (selectedFolder) {
          handleSelectFolder(selectedFolder)
        }
        window.showToast?.('Document renamed successfully', 'success')
      } catch (err) {
        console.error('Failed to rename document locally', err)
        window.showToast?.('Failed to rename document', 'error')
      } finally {
        setPendingRenameItem(null)
      }
      return
    }

    setLoading(true)
    renameFolder(pendingRenameItem.id, nextName)
      .then(() => {
        loadLibraryData()
        if (selectedFolder && selectedFolder.id === pendingRenameItem.id) {
          setSelectedFolder({ ...selectedFolder, name: nextName })
        }
        if (selectedFolderDetails && selectedFolderDetails.id === pendingRenameItem.id) {
          setSelectedFolderDetails({
            ...selectedFolderDetails,
            name: nextName,
            folderName: nextName
          })
        }
        window.showToast?.('Folder renamed successfully', 'success')
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.('Failed to rename folder', 'error')
      })
      .finally(() => {
        setLoading(false)
        setPendingRenameItem(null)
      })
  }

  const handleDeleteFolder = (folder) => {
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
        window.showToast?.('Failed to delete folder', 'error')
      })
      .finally(() => {
        setLoading(false)
        setPendingDelete(null)
      })
  }

  const handleDeleteLibraryFile = (file) => {
    if (!file.id) {
      window.showToast?.('Cannot delete: document ID is missing', 'error')
      return
    }
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
        console.error('[Delete Document Error]', err)
        const msg = err?.data?.message || err?.message || 'Failed to delete document'
        window.showToast?.(`${msg}`, 'error')
      })
      .finally(() => {
        setLoading(false)
        setPendingDelete(null)
      })
  }

  const handleDeleteFolderFile = (folder, file) => {
    if (!file.id) {
      window.showToast?.('Cannot delete: document ID is missing', 'error')
      return
    }
    setLoading(true)
    deleteDocument(file.id)
      .then(() => {
        onRemoveRecentItem?.(file.id)
        handleSelectFolder(folder)
        loadLibraryData()
        window.showToast?.('Document deleted successfully', 'success')
      })
      .catch((err) => {
        console.error('[Delete Document Error]', err)
        const msg = err?.data?.message || err?.message || 'Failed to delete document'
        window.showToast?.(`${msg}`, 'error')
      })
      .finally(() => {
        setLoading(false)
        setPendingDelete(null)
      })
  }

  const handleDeleteItem = (item) => {
    setOpenFileMenuId(null)
    setOpenFolderMenuId(null)
    const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'
    setPendingDelete({
      item,
      isFolder,
      parentFolder: !isFolder && selectedFolder ? selectedFolder : null
    })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete?.item) return

    if (pendingDelete.isFolder) {
      handleDeleteFolder(pendingDelete.item)
      return
    }

    if (pendingDelete.parentFolder) {
      handleDeleteFolderFile(pendingDelete.parentFolder, pendingDelete.item)
      return
    }

    handleDeleteLibraryFile(pendingDelete.item)
  }

  const handleToggleFolderPublish = (folder) => {
    const nextVisibility = folder.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'
    setLoading(true)
    updateFolderVisibility(folder.id, nextVisibility)
      .then((res) => {
        const data = res?.data || res
        loadLibraryData()

        if (selectedFolder?.id === folder.id) {
          setSelectedFolder((prev) => prev ? {
            ...prev,
            visibility: data.visibility || nextVisibility,
            public: (data.visibility || nextVisibility) === 'PUBLIC',
            publishReady: data.publishReady,
            publishBlockedReason: data.publishBlockedReason
          } : prev)
          setSelectedFolderDetails((prev) => prev ? {
            ...prev,
            visibility: data.visibility || nextVisibility,
            public: (data.visibility || nextVisibility) === 'PUBLIC',
            publishReady: data.publishReady,
            publishBlockedReason: data.publishBlockedReason
          } : prev)
        }

        window.showToast?.(
          nextVisibility === 'PUBLIC'
            ? 'Folder published to Explore successfully'
            : 'Folder moved back to private successfully',
          'success'
        )
      })
      .catch((err) => {
        console.error(err)
        window.showToast?.(err?.message || 'Failed to update folder visibility', 'error')
      })
      .finally(() => {
        setLoading(false)
        setOpenFolderMenuId(null)
        setOpenFileMenuId(null)
      })
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
    .dark .hover-action-btn:hover {
      color: #818cf8;
      background-color: #334155;
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
    <div className="bg-white dark:bg-[#0f172a] transition-colors duration-300 ease-in-out" style={{ flex: 1, overflowY: 'auto' }}>
      <style>{customStyles}</style>
      <main style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between', gap: '16px' }}>
          <h1 className="text-slate-900 dark:text-white transition-colors duration-300 ease-in-out" style={{ fontSize: '22px', fontWeight: 600, margin: 0, whiteSpace: 'nowrap' }}>
            Hello, <span style={{ fontWeight: 700 }}>{user?.firstName || 'Student!'}</span>
          </h1>
          
          <div className="bg-[#f8fafc] dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-800 transition-colors duration-300 ease-in-out" style={{ flex: 1, maxWidth: '520px', display: 'flex', alignItems: 'center', borderRadius: '8px', padding: '0 14px', height: '38px', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              placeholder="Search by title or content type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-slate-900 dark:text-white"
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13.5px', background: 'transparent' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
            <label className="text-slate-600 dark:text-slate-400" style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              <button className="bg-white dark:bg-[#1e293b] text-[#4f46e5] dark:text-[#a5b4fc] border border-[#818cf8] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-300 ease-in-out" style={{ height: '34px', padding: '0 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={handleAddFolder} type="button">
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
              user={user}
              onTogglePublish={handleToggleFolderPublish}
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
              user={user}
              onTogglePublish={handleToggleFolderPublish}
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
            onShare={null}
            user={user}
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
            user={user}
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
            user={user}
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
            user={user}
            onTogglePublish={handleToggleFolderPublish}
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
            user={user}
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
        user={user}
        onShare={shareDocument}
        onUpdateVisibility={updateDocumentVisibility}
        onSuccess={() => {
          loadLibraryData()
          if (selectedFolder) {
            handleSelectFolder(selectedFolder)
          }
        }}
      />
      <DeleteConfirmModal
        isOpen={!!pendingDelete}
        loading={loading}
        item={pendingDelete?.item}
        isFolder={pendingDelete?.isFolder}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />
      <RenameItemModal
        isOpen={!!pendingRenameItem}
        loading={loading}
        item={pendingRenameItem}
        onClose={() => setPendingRenameItem(null)}
        onConfirm={handleConfirmRenameItem}
      />
    </div>
  )
}

function DeleteConfirmModal({
  isOpen,
  loading,
  item,
  isFolder,
  onClose,
  onConfirm
}) {
  if (!isOpen || !item) return null

  const itemName = item.name || (isFolder ? 'Untitled Folder' : 'Untitled Document')

  return (
    <div className="modal-backdrop">
      <section className="report-modal delete-confirm-modal">
        <header>
          <h2>
            <StudyHubIcon name="trash" size={18} /> Delete {isFolder ? 'Folder' : 'Document'}
          </h2>
          <button onClick={onClose} type="button" aria-label="Close delete dialog">×</button>
        </header>
        <div className="report-doc delete-confirm-modal__body">
          <strong>{itemName}</strong>
          <p>
            {isFolder
              ? 'This will remove the folder from your library. Please make sure you no longer need the contents inside it.'
              : 'This will permanently remove the document from your library and AI study workspace.'}
          </p>
        </div>
        <div className="warning-box">
          This action cannot be undone.
        </div>
        <footer>
          <button onClick={onClose} disabled={loading} type="button">Cancel</button>
          <button className="danger-button" onClick={onConfirm} disabled={loading} type="button">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function RenameItemModal({
  isOpen,
  loading,
  item,
  onClose,
  onConfirm
}) {
  const [name, setName] = useState(item?.name || '')

  useEffect(() => {
    setName(item?.name || '')
  }, [item])

  if (!isOpen || !item) return null

  const isFolder = item.isFolder || item.type === 'folder' || item.kind === 'folder'

  const handleSubmit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      window.showToast?.(`${isFolder ? 'Folder' : 'Document'} name cannot be empty`, 'error')
      return
    }
    onConfirm(trimmedName)
  }

  return (
    <div className="modal-backdrop">
      <section className="report-modal rename-folder-modal">
        <header>
          <h2>
            <StudyHubIcon name="edit" size={18} /> Rename {isFolder ? 'Folder' : 'Document'}
          </h2>
          <button onClick={onClose} type="button" aria-label="Close rename dialog">×</button>
        </header>
        <label className="rename-folder-modal__label">
          {isFolder ? 'Folder name' : 'Document name'}
          <input
            autoFocus
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                handleSubmit()
              }
            }}
            type="text"
            placeholder={`Enter ${isFolder ? 'folder' : 'document'} name`}
          />
        </label>
        <footer>
          <button onClick={onClose} disabled={loading} type="button">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} type="button">
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </footer>
      </section>
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
  onShare,
  user,
  onTogglePublish
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
        visibility: sf.visibility || 'PRIVATE',
        public: sf.visibility === 'PUBLIC',
        publishReady: sf.publishReady,
        publishBlockedReason: sf.publishBlockedReason,
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
        <span className="text-slate-900 dark:text-white" style={{ fontSize: '13.5px', fontWeight: 500 }}>{folder.name}</span>
        {onAddSubfolder && (
          <button
            onClick={onAddSubfolder}
            type="button"
            title="Create subfolder"
            className="bg-white dark:bg-slate-800 text-[#4f46e5] dark:text-[#a5b4fc] border border-[#818cf8] dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-300 ease-in-out"
            style={{ marginLeft: 'auto', height: '32px', padding: '0 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
          >
            <StudyHubIcon name="plus" size={13} />
            Folder
          </button>
        )}
      </div>

      {/* Content card */}
      <div className="border border-[#e8e8f0] dark:border-slate-800 rounded-xl overflow-visible bg-white dark:bg-[#1e293b] transition-colors duration-300 ease-in-out">
        {combined.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            This folder is empty
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Group header row - lavender like Mindgrasp */}
              <div className="bg-[#f0f0fb] dark:bg-slate-900 text-[#6366f1] dark:text-indigo-400 transition-colors duration-300 ease-in-out" style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em' }}>
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
                    user={user}
                    onTogglePublish={onTogglePublish}
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
  isPinned,
  user,
  onTogglePublish
}) {
  const isActualFolder = isFolder || file.type === 'folder' || file.kind === 'folder'
  const isOwner = isActualFolder || !file.userId || !user?.id || Number(file.userId) === Number(user?.id) || file.uploader === user?.fullName
  const fileRef = file.name.includes('.') ? file.name : file.subject
  const iconName = isActualFolder ? 'folder' : getFileIconName(fileRef)
  const iconColor = isActualFolder ? '#818cf8' : getFileIconColor(fileRef)
  const isPublicFolder = isActualFolder && file.visibility === 'PUBLIC'

  return (
    <div
      onClick={() => onOpenFile(file)}
      className="group flex items-center py-3 px-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative"
    >
      <div className="flex-1 min-w-0 flex items-center gap-3 pr-4">
        <div style={{ color: iconColor }} className="flex-shrink-0 flex items-center justify-center">
          <StudyHubIcon name={iconName} size={20} />
        </div>
        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
          {file.name}
        </span>
        {isActualFolder && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold border ${
              isPublicFolder
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40'
            }`}
          >
            {isPublicFolder ? 'Public' : 'Private'}
          </span>
        )}
      </div>

      <span className="w-20 shrink-0 text-left text-sm text-slate-400 dark:text-slate-500 capitalize">
        {isActualFolder ? 'folder' : 'session'}
      </span>

      <span className="w-28 shrink-0 ml-auto pr-2 text-right text-sm text-slate-400 dark:text-slate-500">
        {file.time || ''}
      </span>

      <div className="w-8 shrink-0 flex justify-end ml-4 relative" onClick={(e) => e.stopPropagation()}>
        <button
          className="more-btn p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors"
          onClick={() => onToggleFileMenu(openFileMenuId === file.id ? null : file.id)}
          type="button"
        >
          <StudyHubIcon name="more-vertical" size={18} />
        </button>

        {openFileMenuId === file.id && (
          <div className="file-action-menu bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-slate-800 transition-colors duration-300 ease-in-out" style={{ position: 'absolute', right: '0', top: 'calc(100% + 8px)', zIndex: 40, borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', padding: '6px', display: 'flex', flexDirection: 'column', minWidth: '180px' }}>
            <button className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { onPin(file); onToggleFileMenu(null) }} type="button">
              <StudyHubIcon name="pin" size={14} style={{ color: isPinned ? '#6366f1' : 'inherit' }} /> {isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { onMove(file); onToggleFileMenu(null) }} type="button">
              <StudyHubIcon name="move" size={14} /> Move
            </button>
            <button className="danger hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => { onDelete(file); onToggleFileMenu(null) }} type="button">
              <StudyHubIcon name="trash" size={14} /> Delete
            </button>
            {isActualFolder && onTogglePublish && (
              <button
                className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                onClick={() => { onTogglePublish(file); onToggleFileMenu(null) }}
                type="button"
                title={file.publishBlockedReason || undefined}
              >
                <StudyHubIcon name={isPublicFolder ? 'lock' : 'globe'} size={14} />
                {isPublicFolder ? 'Make Private' : 'Publish to Explore'}
              </button>
            )}
            {!isActualFolder && onShare && isOwner && (
              <button className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { onShare(file); onToggleFileMenu(null) }} type="button">
                <StudyHubIcon name="share" size={14} /> Share
              </button>
            )}
            <button className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => { onRename(file); onToggleFileMenu(null) }} type="button">
              <StudyHubIcon name="edit" size={14} /> Rename
            </button>
          </div>
        )}
      </div>
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
  onShare,
  user
}) {
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  return (
    <div className="border border-[#e8e8f0] dark:border-slate-800 rounded-xl overflow-visible bg-white dark:bg-[#1e293b] transition-colors duration-300 ease-in-out" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {groups.map((group) => {
        const groupFiles = files.filter((file) => file.group === group)
        if (groupFiles.length === 0) return null;
        return (
          <div key={group}>
            {/* Lavender group header — Mindgrasp style */}
            <div className="bg-[#f0f0fb] dark:bg-slate-900 text-[#6366f1] dark:text-indigo-400 transition-colors duration-300 ease-in-out" style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em' }}>
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
                user={user}
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
  onShare,
  user,
  onTogglePublish
}) {
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  return (
    <div className="border border-[#e8e8f0] dark:border-slate-800 rounded-xl overflow-visible bg-white dark:bg-[#1e293b] transition-colors duration-300 ease-in-out" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {groups.map((group) => {
        const groupFolders = folders.filter((folder) => folder.group === group)
        if (groupFolders.length === 0) return null;
        return (
          <div key={group}>
            {/* Lavender group header — Mindgrasp style */}
            <div className="bg-[#f0f0fb] dark:bg-slate-900 text-[#6366f1] dark:text-indigo-400 transition-colors duration-300 ease-in-out" style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em' }}>
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
                user={user}
                onTogglePublish={onTogglePublish}
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
  onShare,
  user
}) {
  const groups = ['Pinned', 'Today', 'Yesterday', 'This Week', 'Older']
  const files = allFiles || []
  return (
    <div className="border border-[#e8e8f0] dark:border-slate-800 rounded-xl overflow-visible bg-white dark:bg-[#1e293b] transition-colors duration-300 ease-in-out" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {groups.map((group) => {
        const groupFiles = files.filter((file) => file.group === group)
        if (groupFiles.length === 0) return null;
        return (
          <div key={group}>
            {/* Lavender group header — Mindgrasp style */}
            <div className="bg-[#f0f0fb] dark:bg-slate-900 text-[#6366f1] dark:text-indigo-400 transition-colors duration-300 ease-in-out" style={{ padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.02em' }}>
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
                user={user}
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
      <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-slate-800 transition-colors duration-300 ease-in-out" style={{ borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', width: '90%', maxWidth: '480px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Move item</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>&times;</button>
        </header>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, minHeight: '260px', maxHeight: '380px', overflowY: 'auto' }}>
          <p className="text-slate-600 dark:text-slate-300 transition-colors duration-300" style={{ fontSize: '13.5px', margin: 0 }}>
            Move <strong>{item.name}</strong> to:
          </p>
          
          {/* Path Navigator / Breadcrumbs */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', padding: '8px 12px', borderRadius: '8px' }}>
            <button onClick={() => { setCurrentFolder(null); setBreadcrumbs([]); setCurrentSubfolders(folders.filter(f => f.id !== item?.id)); }} className={currentFolder === null ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium'} style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', cursor: 'pointer' }}>Root</button>
            {breadcrumbs.map((b, index) => (
              <span key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }} className="text-slate-400 dark:text-slate-500 transition-colors duration-300">
                <span>&rsaquo;</span>
                <button onClick={() => {
                  const nextB = breadcrumbs.slice(0, index + 1)
                  setBreadcrumbs(nextB)
                  navigateToFolder(b)
                }} className={index === breadcrumbs.length - 1 ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium'} style={{ background: 'none', border: 'none', padding: 0, fontSize: '13px', cursor: 'pointer' }}>{b.name || b.folderName}</button>
              </span>
            ))}
          </div>

          {/* Subfolders list */}
          <div className="border border-slate-200 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderRadius: '10px', overflow: 'hidden', minHeight: '160px' }}>
            {breadcrumbs.length > 0 && (
              <button onClick={navigateUp} className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>
                <span>&larr; Back to parent folder</span>
              </button>
            )}
            
            {loading ? (
              <div className="text-slate-400 dark:text-slate-500 transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', fontSize: '13px' }}>Loading subfolders...</div>
            ) : currentSubfolders.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', fontSize: '13px', fontStyle: 'italic' }}>No subfolders here</div>
            ) : (
              currentSubfolders.map(sub => (
                <button key={sub.id} onClick={() => navigateToFolder(sub)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-colors duration-150" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{sub.folderName || sub.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px 20px' }}>
          <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200" style={{ height: '36px', padding: '0 16px', background: 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onMove(currentFolder?.id || null)} className="bg-[#4f46e5] hover:bg-indigo-700 text-white transition-colors duration-200" style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Move here</button>
        </footer>
      </div>
    </div>
  )
}

function ShareModal({ isOpen, onClose, item, user, onShare, onUpdateVisibility, onSuccess }) {
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

  const isOwner = !item.userId || !user?.id || Number(item.userId) === Number(user?.id) || item.uploader === user?.fullName

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
      <div className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 transition-colors duration-300 ease-in-out" style={{ borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', width: '90%', maxWidth: '460px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '24px', gap: '20px', position: 'relative' }}>
        
        {/* Close Button */}
        <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200" style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>
          &times;
        </button>

        {/* Title */}
        <h3 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '17px', fontWeight: 700, margin: 0, paddingRight: '30px', lineHeight: 1.4 }}>
          Share "{item.name}"
        </h3>

        {/* General Access - Only shown/editable for owners */}
        {isOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span className="text-slate-600 dark:text-slate-400 transition-colors duration-300" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              General access
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Toggle Button Segmented Control */}
              <div className="border border-slate-200 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', height: '36px', width: '80px', flexShrink: 0 }}>
                <button 
                  type="button" 
                  onClick={() => setVisibility('PRIVATE')} 
                  className={`flex-1 flex items-center justify-center border-none cursor-pointer transition-all duration-200 ${visibility === 'PRIVATE' ? 'bg-[#4f46e5] text-white' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  title="Restricted"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => setVisibility('PUBLIC')} 
                  className={`flex-1 flex items-center justify-center border-none cursor-pointer transition-all duration-200 ${visibility === 'PUBLIC' ? 'bg-[#4f46e5] text-white' : 'bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  title="Anyone with the link"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                </button>
              </div>

              {/* Description Text */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span className="text-slate-900 dark:text-white transition-colors duration-300" style={{ fontSize: '14px', fontWeight: 700 }}>
                  {visibility === 'PUBLIC' ? 'Anyone with the link' : 'Restricted'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 transition-colors duration-300" style={{ fontSize: '12px' }}>
                  {visibility === 'PUBLIC' 
                    ? 'Anyone on the internet with this link can view.' 
                    : 'Only the people you invite can view.'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add People */}
        <form onSubmit={handleAddPerson} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label className="text-slate-600 dark:text-slate-400 transition-colors duration-300" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Add people
          </label>
          <input
            type="email"
            required
            placeholder="Enter email address to share with"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white outline-none focus:border-[#4f46e5] dark:focus:border-indigo-400 transition-colors duration-200"
            style={{ width: '100%', height: '40px', padding: '0 14px', borderRadius: '8px', fontSize: '13.5px' }}
          />
          <button 
            type="submit" 
            disabled={loading || !email.trim()}
            className={`w-full h-[38px] rounded-lg text-[13.5px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors duration-200 ${(loading || !email.trim()) ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-[#4f46e5] hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 cursor-pointer'}`}
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </form>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '16px' }}>
          <button 
            type="button" 
            onClick={handleCopyLink}
            className="hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-[#6366f1] dark:text-indigo-400 border border-[#6366f1] dark:border-indigo-400 transition-all duration-200"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', background: 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            {isCopied ? 'Copied' : 'Copy link'}
          </button>
          
          {isOwner ? (
            <button 
              type="button" 
              onClick={handleSaveVisibility}
              disabled={saveLoading}
              className={`h-[36px] px-5 rounded-lg text-sm font-semibold text-white transition-colors duration-200 ${saveLoading ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed' : 'bg-[#4f46e5] hover:bg-indigo-700 cursor-pointer'}`}
            >
              {saveLoading ? 'Saving...' : 'Save'}
            </button>
          ) : (
            <button 
              type="button" 
              onClick={onClose}
              className="bg-[#4f46e5] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200"
              style={{ height: '36px', padding: '0 20px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
