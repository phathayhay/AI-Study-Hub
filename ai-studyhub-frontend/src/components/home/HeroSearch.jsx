import { useState } from 'react'
import { majors, popularCourses } from '../../data/studyHubData'
import StudyHubIcon from '../icons/StudyHubIcons'

function FilterRow({ label, items, onSelect, accent = false }) {
  return (
    <div className="filter-row">
      <span>{label}</span>
      {items.map((item) => (
        <button 
          className={accent ? 'chip chip--accent' : 'chip'} 
          key={item} 
          type="button"
          onClick={() => onSelect && onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export default function HeroSearch({ title = 'FPTU Study Materials', onSearch, onSelectMajor, onSelectCourse }) {
  const [keyword, setKeyword] = useState('')

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(keyword)
    }
  }

  return (
    <section className="hero-section" aria-labelledby="home-title">
      <h1 id="home-title">{title}</h1>
      <p>Search, share, and manage study materials with AI power</p>

      <form onSubmit={handleSearchSubmit} className="hero-search" role="search">
        <StudyHubIcon name="search" size={20} />
        <input 
          placeholder="Search by course code (e.g. CEA201, PRF192, SWP391...)" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className="hero-filters" aria-label="Quick Filter">
        <FilterRow label="Popular courses:" items={popularCourses} onSelect={onSelectCourse} />
        <FilterRow label="Majors:" items={majors} onSelect={onSelectMajor} accent />
      </div>
    </section>
  )
}
