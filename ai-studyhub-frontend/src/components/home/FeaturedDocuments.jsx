import { featuredDocuments } from '../../data/studyHubData'
import DocumentCard from './DocumentCard'
import SectionHeader from './SectionHeader'

export default function FeaturedDocuments() {
  return (
    <section className="content-section">
      <SectionHeader className="section-header--green" icon="trend" title="Featured Documents" />
      <div className="document-grid">
        {featuredDocuments.map((document) => (
          <DocumentCard document={document} key={`${document.code}-${document.type}`} />
        ))}
      </div>
      <div className="section-action">
        <button type="button">View All Documents</button>
      </div>
    </section>
  )
}
