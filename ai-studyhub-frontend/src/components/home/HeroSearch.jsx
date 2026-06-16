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

export default function HeroSearch({ title = 'Tài liệu học tập FPTU' }) {
  return (
    <section className="hero-section" aria-labelledby="home-title">
      <h1 id="home-title">{title}</h1>
      <p>Tìm kiếm, chia sẻ và quản lý tài liệu học tập với sức mạnh AI</p>

      <div className="hero-search" role="search">
        <StudyHubIcon name="search" size={20} />
        <input placeholder="Tìm kiếm theo mã môn học (VD: CEA201, PRF192, SWP391...)" />
        <button type="button">Tìm kiếm</button>
      </div>

      <div className="hero-filters" aria-label="Bộ lọc nhanh">
        <FilterRow label="Môn học phổ biến:" items={popularCourses} />
        <FilterRow label="Ngành học:" items={majors} accent />
      </div>
    </section>
  )
}
