import AppLayout from '../components/layout/AppLayout'
import FeaturedDocuments from '../components/home/FeaturedDocuments'
import FeaturedFolders from '../components/home/FeaturedFolders'
import HeroSearch from '../components/home/HeroSearch'
import StatsSummary from '../components/home/StatsSummary'

export default function Home() {
  return (
    <AppLayout>
      <main className="home-main dark:bg-[#0f172a] dark:bg-none">
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
