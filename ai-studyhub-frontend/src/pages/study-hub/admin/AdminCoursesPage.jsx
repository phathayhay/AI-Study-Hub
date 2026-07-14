import { useMemo, useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import Badge from '../../../components/ui/Badge'
import { useAdminResource as useAdminList } from '../../../features/admin/hooks/useAdminResource'
import { readCourseMajors } from '../../../features/admin/utils/adminNormalizers'
import { compareText, matchesSearch } from '../../../features/admin/utils/adminSorters'
import { AdminSectionHeader } from '../../../features/admin/components/AdminSectionHeader'
import { AdminSearch } from '../../../features/admin/components/AdminFilters'
import { AdminResourceState as AdminTableState } from '../../../features/admin/components/AdminResourceState'
import { runAdminAction } from '../../../features/admin/utils/adminActions'

import { deleteAdminCourse, getAdminCourses } from '../../../features/admin/adminService'

export function AdminCourses({ onEdit }) {
  const { data: courses, error, loading, reload } = useAdminList(getAdminCourses)
  const [query, setQuery] = useState('')
  const [majorFilter, setMajorFilter] = useState('')
  const majorOptions = useMemo(() => {
    return [...new Set(courses.flatMap((course) => readCourseMajors(course).map((major) => major?.majorCode)).filter(Boolean))].sort((left, right) => compareText(left, right))
  }, [courses])
  const visibleCourses = useMemo(() => {
    return courses.filter((course) => {
      const courseMajorCodes = readCourseMajors(course).map((major) => String(major?.majorCode || '').toUpperCase()).filter(Boolean)
      const matchesMajor = !majorFilter || courseMajorCodes.includes(majorFilter.toUpperCase())
      const matchesCourseSearch = matchesSearch(query, [
        course.courseCode,
        course.courseName,
        course.description,
        ...readCourseMajors(course).flatMap((major) => [major?.majorCode, major?.majorName]),
      ])
      return matchesMajor && matchesCourseSearch
    })
  }, [courses, majorFilter, query])

  return (
    <main className="admin-page">
      <section className="admin-card admin-course-card">
        <AdminSectionHeader icon="book" title="Subject Management">
          <button className="admin-primary" onClick={() => onEdit({ mode: 'add', onSaved: reload })} type="button">
            <StudyHubIcon name="plus" size={18} /> Add Subject
          </button>
        </AdminSectionHeader>
        <div className="admin-search-row">
          <AdminSearch onChange={setQuery} placeholder="Search subjects..." value={query} />
          <select aria-label="Filter by major" className="admin-filter-input" onChange={(event) => setMajorFilter(event.target.value)} value={majorFilter}>
            <option value="">All majors</option>
            {majorOptions.map((majorCode) => <option key={majorCode} value={majorCode}>{majorCode}</option>)}
          </select>
        </div>
        <AdminTableState error={error} loading={loading} />
        <div className="course-grid">
          {visibleCourses.map((course) => (
            <article className="course-card" key={course.id || course.courseCode}>
              <div>
                <h3>{course.courseCode}</h3>
                <p>{course.courseName}</p>
              </div>
              <div className="course-actions">
                <button onClick={() => onEdit({ mode: 'edit', course, onSaved: reload })} type="button"><StudyHubIcon name="edit" size={16} /></button>
                <button onClick={() => runAdminAction(() => deleteAdminCourse(course.id), reload, 'Course deleted')} type="button">
                  <StudyHubIcon name="archive" size={16} />
                </button>
              </div>
              <div>
                <Badge tone="purple">{course.isActive ? 'Active' : 'Inactive'}</Badge>
                {readCourseMajors(course).length > 0
                  ? readCourseMajors(course).map((major) => (
                    <Badge key={`${course.id || course.courseCode}-${major?.id || major?.majorCode}`} tone="blue">
                      {major?.majorCode || 'Major'}
                    </Badge>
                  ))
                  : <Badge tone="blue">Major</Badge>}
              </div>
              <footer><span>{course.description || 'No description'}</span></footer>
            </article>
          ))}
          {!loading && !error && visibleCourses.length === 0 && <p className="admin-empty">No matching subjects</p>}
        </div>
      </section>
    </main>
  )
}

export default AdminCourses
