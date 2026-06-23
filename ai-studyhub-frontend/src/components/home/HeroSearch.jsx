import { majors, popularCourses } from '../../data/studyHubData'
import StudyHubIcon from '../icons/StudyHubIcons'

function FilterRow({ label, items, accent = false }) {
  return (
    <div className="filter-row">
      <span>{label}</span>
      {items.map((item) => (
        <button className={accent ? 'chip chip--accent' : 'chip'} key={item} type="button">
          {item}
        </button>
      ))}
    </div>
  )
}

export default function HeroSearch({ title = 'FPTU Study Materials' }) {
  return (
    <section className="hero-section" aria-labelledby="home-title">
      <h1 id="home-title">{title}</h1>
      <p>Search, share, and manage study materials with AI power</p>

      <div className="hero-search" role="search">
        <StudyHubIcon name="search" size={20} />
        <input placeholder="Search by course code (e.g. CEA201, PRF192, SWP391...)" />
        <button type="button">Search</button>
      </div>

      <div className="hero-filters" aria-label="Quick Filter">
        <FilterRow label="Popular courses:" items={popularCourses} />
        <FilterRow label="Majors:" items={majors} accent />
      </div>
    </section>
  )
}
