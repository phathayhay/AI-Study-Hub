import { useEffect, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import { getFolder } from '../../../features/folders/folderService'

export function DeleteConfirmModal({
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
      <section className="report-modal delete-confirm-modal bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
        <header className="border-b border-slate-100 dark:border-slate-700">
          <h2>
            <StudyHubIcon name="trash" size={18} /> Delete {isFolder ? 'Folder' : 'Document'}
          </h2>
          <button onClick={onClose} type="button" className="cursor-pointer text-slate-400 hover:text-slate-600" aria-label="Close delete dialog">×</button>
        </header>
        <div className="report-doc delete-confirm-modal__body bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <strong>{itemName}</strong>
          <p className="text-slate-600 dark:text-slate-350">
            {isFolder
              ? 'This will remove the folder from your library. Please make sure you no longer need the contents inside it.'
              : 'This will permanently remove the document from your library and AI study workspace.'}
          </p>
        </div>
        <div className="warning-box bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300">
          This action cannot be undone.
        </div>
        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} disabled={loading} type="button" className="cursor-pointer border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button className="danger-button cursor-pointer" onClick={onConfirm} disabled={loading} type="button">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export function RenameItemModal({
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
      <section className="report-modal rename-folder-modal bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800">
        <header className="border-b border-slate-100 dark:border-slate-700">
          <h2>
            <StudyHubIcon name="edit" size={18} /> Rename {isFolder ? 'Folder' : 'Document'}
          </h2>
          <button onClick={onClose} type="button" className="cursor-pointer text-slate-400 hover:text-slate-600" aria-label="Close rename dialog">×</button>
        </header>
        <label className="rename-folder-modal__label text-slate-600 dark:text-slate-400">
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
            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white"
            placeholder={`Enter ${isFolder ? 'folder' : 'document'} name`}
          />
        </label>
        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
          <button onClick={onClose} disabled={loading} type="button" className="cursor-pointer border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} type="button" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-0">
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </footer>
      </section>
    </div>
  )
}

export function MoveModal({ isOpen, onClose, item, folders = [], onMove }) {
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
          <button onClick={onClose} className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer" style={{ height: '36px', padding: '0 16px', background: 'transparent', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>Cancel</button>
          <button onClick={() => onMove(currentFolder?.id || null)} className="bg-[#4f46e5] hover:bg-indigo-700 text-white transition-colors duration-200 cursor-pointer" style={{ height: '36px', padding: '0 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>Move here</button>
        </footer>
      </div>
    </div>
  )
}

export function ShareModal({ isOpen, onClose, item, user, onShare, onUpdateVisibility, onSuccess }) {
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
        <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200" style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justify: 'center', width: '24px', height: '24px' }}>
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
        <div className="border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginTop: '4px', paddingTop: '16px' }}>
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
