import FeaturedDocuments from '../../components/home/FeaturedDocuments'
import FeaturedFolders from '../../components/home/FeaturedFolders'
import HeroSearch from '../../components/home/HeroSearch'
import StatsSummary from '../../components/home/StatsSummary'

export function HomeScreen({ guest = false, onNavigate }) {
  const handleSearch = (keyword) => {
    onNavigate('explore', { keyword })
  }
  const handleSelectMajor = (majorCode) => {
    onNavigate('explore', { majorCode })
  }
  const handleSelectCourse = (courseCode) => {
    onNavigate('explore', { courseCode })
  }

  return (
    <main className="home-main dark:bg-[#0f172a] dark:bg-none">
      <div className="home-container">
        <HeroSearch 
          title={guest ? 'Study Materials for FPTU Students' : 'FPTU Study Materials'} 
          onSearch={handleSearch}
          onSelectMajor={handleSelectMajor}
          onSelectCourse={handleSelectCourse}
        />
        <StatsSummary />
        <div onClick={() => onNavigate('folder-detail')} role="presentation">
          <FeaturedFolders />
        </div>
        <div onClick={() => onNavigate('doc-detail')} role="presentation">
          <FeaturedDocuments />
        </div>
      </div>
    </main>
  )
}
