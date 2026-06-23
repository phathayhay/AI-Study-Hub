import { featuredFolders } from '../../data/studyHubData'
import FeaturedFolderCard from './FeaturedFolderCard'
import SectionHeader from './SectionHeader'

export default function FeaturedFolders({ folders = featuredFolders, onOpenFolder, hideHeader = false }) {
  return (
    <section className="content-section">
      {!hideHeader && <SectionHeader icon="folder" title="Featured Folders" />}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {folders.map((folder) => (
          <FeaturedFolderCard 
            folder={folder} 
            key={folder.id || folder.code} 
            onClick={() => onOpenFolder?.(folder.id)}
          />
        ))}
      </div>
    </section>
  )
}


