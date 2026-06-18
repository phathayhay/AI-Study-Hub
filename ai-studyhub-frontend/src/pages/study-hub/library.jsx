import { useEffect, useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { libraryTabs } from './config'
import { 
  getMyDocuments, 
  getSharedDocuments, 
  deleteDocument,
  getFavoriteDocuments, 
  getHistoryDocuments 
} from '../../features/documents/documentService'
import { 
  getRootFolders, 
  getFolder,
  createFolder, 
  renameFolder, 
  deleteFolder 
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
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  
  return {
    id: doc.id,
    name: doc.title || doc.fileName || 'Untitled',
    subject: doc.fileType || 'Document',
    kind: 'document',
    type: 'session',
    group: getItemGroup(doc.createdAt),
    date: dateObj.toLocaleDateString(),
    time: timeFormatted,
    shared: doc.visibility === 'PUBLIC',
    public: doc.visibility === 'PUBLIC',
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
        const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        return {
          id: f.id,
          name: f.folderName || f.name || 'Untitled Folder',
          count: f.documents?.length || f.documentCount || 0,
          date: dateObj.toLocaleDateString(),
          time: timeFormatted,
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
      handleSelectFolder({ id: initialFolderId, name: 'Đang tải...' })
      onClearInitialFolderId?.()
    }
  }, [initialFolderId])

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
    const name = window.prompt('Nhập tên thư mục mới:')?.trim()
    if (!name) return
    setLoading(true)
    createFolder(name)
      .then(() => {
        loadLibraryData()
        onTabChange('folders')
        window.showToast?.('Folder created', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to create folder', 'error')
      })
  }

  const handleAddSubfolder = (parentFolder) => {
    const name = window.prompt(`Nhập tên thư mục con trong "${parentFolder.name}":`)
    if (!name?.trim()) return
    setFolderLoading(true)
    createFolder(name.trim(), parentFolder.id)
      .then(() => {
        // Reload the current folder to reflect new subfolder
        handleSelectFolder(parentFolder)
        loadLibraryData()
        window.showToast?.('Folder created', 'success')
      })
      .catch((err) => {
        console.error(err)
        setFolderLoading(false)
        window.showToast?.('Failed to create subfolder', 'error')
      })
  }

  const handleRenameFolder = (folder) => {
    const nextName = window.prompt('Nhập tên thư mục mới:', folder.name)?.trim()
    if (!nextName) return
    setLoading(true)
    renameFolder(folder.id, nextName)
      .then(() => {
        loadLibraryData()
        if (selectedFolder && selectedFolder.id === folder.id) {
          setSelectedFolder({ ...selectedFolder, name: nextName })
        }
        window.showToast?.('Folder renamed', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to rename folder', 'error')
      })
    setOpenFolderMenuId(null)
  }

  const handleDeleteFolder = (folder) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa thư mục "${folder.name}" không?`)) return
    setLoading(true)
    deleteFolder(folder.id)
      .then(() => {
        loadLibraryData()
        onRemoveRecentItem?.(folder.id, 'folder')
        if (selectedFolder?.id === folder.id) {
          setSelectedFolder(null)
          setSelectedFolderDetails(null)
        }
        window.showToast?.('Folder deleted', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to delete folder', 'error')
      })
    setOpenFolderMenuId(null)
  }

  const handleDeleteLibraryFile = (file) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${file.name}" không?`)) return
    setLoading(true)
    deleteDocument(file.id)
      .then(() => {
        loadLibraryData()
        onRemoveRecentItem?.(file.id)  // Remove all recent entries for this deleted document
        if (selectedFolder) {
          handleSelectFolder(selectedFolder)
        }
        window.showToast?.('Document deleted', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to delete document', 'error')
      })
    setOpenFileMenuId(null)
  }

  const handleDeleteFolderFile = (folder, file) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${file.name}" khỏi thư mục không?`)) return
    setLoading(true)
    deleteDocument(file.id)
      .then(() => {
        onRemoveRecentItem?.(file.id)  // Remove all recent entries for this deleted document
        handleSelectFolder(folder)
        loadLibraryData()
        window.showToast?.('Document deleted', 'success')
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
        window.showToast?.('Failed to remove document from folder', 'error')
      })
    setOpenFileMenuId(null)
  }

  const handleRenameLibraryFile = (file) => {
    window.showToast?.('Renaming documents directly is not supported yet', 'info')
    setOpenFileMenuId(null)
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
      }
      onOpenFile?.(activeFile)
    }
  }

  // Study sessions tab: Combine folders and root documents
  const combinedItems = useMemo(() => {
    const rootDocs = apiDocs.filter(d => !d.folderId)
    const combined = [...apiFolders, ...rootDocs]
    
    return combined.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA
      }
    })
  }, [apiDocs, apiFolders, sortBy])

  const filteredCombinedItems = useMemo(() => {
    return combinedItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [combinedItems, searchQuery])

  const filteredSharedDocs = useMemo(() => {
    return apiSharedDocs.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiSharedDocs, searchQuery, sortBy])

  const filteredFavoriteDocs = useMemo(() => {
    return apiFavoriteDocs.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiFavoriteDocs, searchQuery, sortBy])

  const filteredHistoryDocs = useMemo(() => {
    return apiHistoryDocs.filter(doc => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiHistoryDocs, searchQuery, sortBy])

  const filteredFoldersOnly = useMemo(() => {
    return apiFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })
  }, [apiFolders, searchQuery, sortBy])

  return (
    <div style={{ flex: 1, backgroundColor: '#fff', overflowY: 'auto' }}>
      <main style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap' }}>
            Hello, <span style={{ fontWeight: 700 }}>{user?.fullName || 'Sinh viên!'}</span>
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
            Đang tải dữ liệu...
          </div>
        ) : activeTab === 'folders' ? (
          selectedFolder ? (
            <FolderFilesView
              folder={selectedFolderDetails || selectedFolder}
              subfolders={selectedFolderDetails?.subfolders || []}
              files={selectedFolderDetails?.documents || []}
              loading={folderLoading}
              onBack={() => { setSelectedFolder(null); setSelectedFolderDetails(null); }}
              onDeleteFile={(folderOrFile, file) => {
                if (!file) {
                  handleDeleteFolder(folderOrFile)
                } else {
                  handleDeleteFolderFile(folderOrFile, file)
                }
              }}
              onRenameFile={(file) => {
                if (file.isFolder) {
                  handleRenameFolder(file)
                } else {
                  handleRenameLibraryFile(file)
                }
              }}
              onOpenFile={handleOpenFile}
              onToggleFileMenu={setOpenFileMenuId}
              openFileMenuId={openFileMenuId}
              onSelectSubfolder={handleSelectFolder}
              onAddSubfolder={() => handleAddSubfolder(selectedFolderDetails || selectedFolder)}
            />
          ) : (
            <GroupedFolders
              folders={filteredFoldersOnly}
              onDeleteFolder={handleDeleteFolder}
              onOpenFolder={handleSelectFolder}
              onRenameFolder={handleRenameFolder}
              onToggleFolderMenu={setOpenFolderMenuId}
              openFolderMenuId={openFolderMenuId}
            />
          )
        ) : activeTab === 'shared' ? (
          <SharedLibraryFiles
            allFiles={filteredSharedDocs}
            onDeleteFile={handleDeleteLibraryFile}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameLibraryFile}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
          />
        ) : activeTab === 'favorites' ? (
          <SharedLibraryFiles
            allFiles={filteredFavoriteDocs}
            onDeleteFile={handleDeleteLibraryFile}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameLibraryFile}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
          />
        ) : activeTab === 'recent' ? (
          <SharedLibraryFiles
            allFiles={filteredHistoryDocs}
            onDeleteFile={handleDeleteLibraryFile}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRenameLibraryFile}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
          />
        ) : selectedFolder ? (
          <FolderFilesView
            folder={selectedFolderDetails || selectedFolder}
            subfolders={selectedFolderDetails?.subfolders || []}
            files={selectedFolderDetails?.documents || []}
            loading={folderLoading}
            onBack={() => { setSelectedFolder(null); setSelectedFolderDetails(null); }}
            onDeleteFile={(folderOrFile, file) => {
              if (!file) {
                handleDeleteFolder(folderOrFile)
              } else {
                handleDeleteFolderFile(folderOrFile, file)
              }
            }}
            onRenameFile={(file) => {
              if (file.isFolder) {
                handleRenameFolder(file)
              } else {
                handleRenameLibraryFile(file)
              }
            }}
            onOpenFile={handleOpenFile}
            onToggleFileMenu={setOpenFileMenuId}
            openFileMenuId={openFileMenuId}
            onSelectSubfolder={handleSelectFolder}
            onAddSubfolder={() => handleAddSubfolder(selectedFolderDetails || selectedFolder)}
          />
        ) : (
          <GroupedFiles
            files={filteredCombinedItems}
            onDeleteFile={handleDeleteLibraryFile}
            onOpenFile={handleOpenFile}
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
  onAddSubfolder
}) {
  if (loading) {
    return (
      <div style={{ padding: '64px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
        Đang tải dữ liệu...
      </div>
    )
  }

  const combined = [
    ...subfolders.map(sf => ({
      id: sf.id,
      name: sf.folderName || sf.name || 'Untitled Folder',
      type: 'folder',
      isFolder: true,
      createdAt: sf.createdAt
    })),
    ...files.map(f => mapDoc(f))
  ]

  // Group items by date
  const groups = ['Today', 'Yesterday', 'This Week', 'Older']
  const grouped = groups.map(g => ({
    label: g,
    items: combined.filter(item => {
      const grp = getItemGroup(item.createdAt)
      return grp === g
    })
  })).filter(g => g.items.length > 0)
  if (grouped.length === 0 && combined.length > 0) grouped.push({ label: 'Older', items: combined })

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
            title="Tạo thư mục con"
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
            Thư mục này trống
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label}>
              {/* Group header row - lavender like Mindgrasp */}
              <div style={{ backgroundColor: '#f0f0fb', padding: '8px 20px', fontSize: '12.5px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.02em' }}>
                {label}
              </div>
              {items.map((item) => (
                <ActionableFileRow
                  key={item.id}
                  file={item}
                  isFolder={item.isFolder}
                  onDeleteFile={(f) => {
                    if (f.isFolder) {
                      onDeleteFile(f)
                    } else {
                      onDeleteFile(folder, f)
                    }
                  }}
                  onOpenFile={(f) => {
                    if (f.isFolder) {
                      onSelectSubfolder(f)
                    } else {
                      onOpenFile(f)
                    }
                  }}
                  onRenameFile={onRenameFile}
                  onToggleFileMenu={onToggleFileMenu}
                  openFileMenuId={openFileMenuId}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
function ActionableFileRow({ file, isFolder, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  const isActualFolder = isFolder || file.type === 'folder' || file.kind === 'folder';
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%', backgroundColor: hovered ? '#f8f8ff' : '#fff', transition: 'background 0.15s', borderBottom: '1px solid #f0f0f8' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <FileRow file={file} isFolder={isActualFolder} onClick={() => onOpenFile(file)} hovered={hovered} />
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFileMenu(openFileMenuId === file.id ? null : file.id) }}
        type="button"
        style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: hovered ? '#6366f1' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', borderRadius: '6px', transition: 'color 0.15s' }}
      >
        <StudyHubIcon name="more-vertical" size={18} />
      </button>
      {openFileMenuId === file.id && (
        <div className="file-action-menu" style={{ position: 'absolute', right: '12px', top: '100%', zIndex: 20, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(99,102,241,0.12)', padding: '6px', display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
          <button onClick={() => onRenameFile(file)} type="button" style={{ padding: '8px 14px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', borderRadius: '6px', color: '#374151' }}>
            {isActualFolder ? 'Đổi tên thư mục' : 'Đổi tên tài liệu'}
          </button>
          <button onClick={() => onDeleteFile(file)} type="button" style={{ padding: '8px 14px', textAlign: 'left', border: 'none', background: 'transparent', fontSize: '13px', cursor: 'pointer', borderRadius: '6px', color: '#ef4444' }}>
            {isActualFolder ? 'Xóa thư mục' : 'Xóa tài liệu'}
          </button>
        </div>
      )}
    </div>
  )
}

function GroupedFiles({ files, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  const groups = ['Today', 'Yesterday', 'This Week', 'Older']
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
                onDeleteFile={onDeleteFile}
                onOpenFile={onOpenFile}
                onRenameFile={onRenameFile}
                onToggleFileMenu={onToggleFileMenu}
                openFileMenuId={openFileMenuId}
              />
            ))}
          </div>
        )
      })}
      {files.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          No study sessions found
        </div>
      )}
    </div>
  )
}

function GroupedFolders({ folders, onDeleteFolder, onOpenFolder, onRenameFolder, onToggleFolderMenu, openFolderMenuId }) {
  const groups = ['Today', 'Yesterday', 'This Week', 'Older']
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
                onDeleteFile={onDeleteFolder}
                onOpenFile={onOpenFolder}
                onRenameFile={onRenameFolder}
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

function SharedLibraryFiles({ allFiles, onDeleteFile, onOpenFile, onRenameFile, onToggleFileMenu, openFileMenuId }) {
  const groups = ['Today', 'Yesterday', 'This Week', 'Older']
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
                onDeleteFile={onDeleteFile}
                onOpenFile={onOpenFile}
                onRenameFile={onRenameFile}
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
  return (
    <button
      onClick={onClick}
      type="button"
      style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '13px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
    >
      <div style={{ color: '#818cf8', marginRight: '14px', flexShrink: 0 }}>
        <StudyHubIcon name={isActualFolder ? 'folder' : 'file'} size={20} />
      </div>
      <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 500, color: '#4f46e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: hovered ? 'underline' : 'none' }}>
        {file.name}
      </span>
      <span style={{ width: '110px', fontSize: '12.5px', color: '#94a3b8', flexShrink: 0 }}>
        {isActualFolder ? 'folder' : 'session'}
      </span>
      <span style={{ width: '70px', fontSize: '12.5px', color: '#94a3b8', textAlign: 'right', paddingRight: '36px', flexShrink: 0 }}>
        {file.time || ''}
      </span>
    </button>
  )
}
