import StudyHubIcon, { getFileIconName, getFileIconColor } from '../../../components/icons/StudyHubIcons'

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

export function ActionableFileRow({ 
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
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-350 dark:border-emerald-900/40'
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
          className="more-btn p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-0"
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

export function FolderFilesView({
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
    items: combined.filter(item => item.group === g)
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
              {/* Group header row */}
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
                    onOpenFile={isFolder ? onSelectSubfolder : onOpenFile}
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
