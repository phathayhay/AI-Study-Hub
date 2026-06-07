import { featuredFolders } from '../../data/studyHubData'
import FeaturedFolderCard from './FeaturedFolderCard'
import SectionHeader from './SectionHeader'

export default function FeaturedFolders() {
  return (
    <section className="content-section">
      <SectionHeader icon="folder" title="Thư mục nổi bật" />
      <div className="folder-grid">
        {featuredFolders.map((folder) => (
          <FeaturedFolderCard folder={folder} key={folder.code} />
        ))}
      </div>
    </section>
  )
}
