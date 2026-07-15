import { ActionableFileRow } from './FolderFilesView'

export function GroupedFolders({ 
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
