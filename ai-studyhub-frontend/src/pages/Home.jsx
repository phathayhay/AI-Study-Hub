import AppLayout from '../components/layout/AppLayout'
import FeaturedDocuments from '../components/home/FeaturedDocuments'
import FeaturedFolders from '../components/home/FeaturedFolders'
import HeroSearch from '../components/home/HeroSearch'
import StatsSummary from '../components/home/StatsSummary'

export default function Home() {
  return (
    <AppLayout>
      <main className="home-main">
        <div className="home-container">
          <HeroSearch />
          <StatsSummary />
          <FeaturedFolders />
          <FeaturedDocuments />
        </div>
      </main>
    </AppLayout>
  )
}
