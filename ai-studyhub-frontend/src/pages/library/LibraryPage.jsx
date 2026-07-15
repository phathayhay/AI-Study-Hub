import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
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

import { FolderFilesView } from './components/FolderFilesView'
import { GroupedFolders } from './components/GroupedFolders'
import { GroupedFiles } from './components/GroupedFiles'
import { SharedLibraryFiles } from './components/SharedLibraryFiles'
import { DeleteConfirmModal, RenameItemModal, MoveModal, ShareModal } from './components/LibraryModals'

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
