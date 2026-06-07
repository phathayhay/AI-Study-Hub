import { useMemo, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import Badge from '../../components/ui/Badge'
import { libraryFiles, libraryFolders } from '../../data/studyHubData'
import { libraryTabs } from './config'

export function LibraryPage({ activeTab, onNavigate, onOpenFile, onTabChange }) {
  const files = useMemo(() => {
    if (activeTab === 'shared') return libraryFiles.filter((file) => file.shared)
    if (activeTab === 'favorites') return libraryFiles.filter((file) => file.favorite)
    if (activeTab === 'recent') return libraryFiles
    return libraryFiles.slice(0, 4)
  }, [activeTab])

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
            <button className="primary-action" type="button"><StudyHubIcon name="plus" size={18} /> Folder</button>
          </div>
        </div>
        <div className="search-line library-search">
          <StudyHubIcon name="search" size={18} />
          <input placeholder="Search by title or content type..." />
        </div>

        {activeTab === 'folders' ? (
          <div className="folder-library-grid">
            {libraryFolders.map((folder) => (
              <article className="library-folder" key={folder.id}>
                <span><StudyHubIcon name="folder" size={26} /></span>
                <h3>{folder.name}</h3>
                <p>{folder.count} documents</p>
                <small>{folder.date}</small>
              </article>
            ))}
          </div>
        ) : activeTab === 'shared' ? (
          <SharedLibraryFiles onOpenFile={onOpenFile} />
        ) : (
          <GroupedFiles files={files} onOpenFile={onOpenFile} />
        )}
      </main>
    </div>
  )
}

function LibraryRail({ activeTab, onNavigate, onTabChange }) {
  return (
    <aside className="library-rail">
      <button className="new-session" onClick={() => onNavigate('study')} type="button">
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

function GroupedFiles({ files, onOpenFile }) {
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
              <FileRow file={file} key={file.id} onClick={() => onOpenFile(file)} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

function SharedLibraryFiles({ onOpenFile }) {
  const [shareScope, setShareScope] = useState('public')
  const files = libraryFiles.filter((file) => (shareScope === 'public' ? file.public : file.shared))

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
          <FileRow file={file} key={file.id} onClick={() => onOpenFile(file)} />
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
