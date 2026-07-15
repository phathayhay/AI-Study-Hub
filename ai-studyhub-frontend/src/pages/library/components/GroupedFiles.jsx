import { ActionableFileRow } from './FolderFilesView'

export function GroupedFiles({ 
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
