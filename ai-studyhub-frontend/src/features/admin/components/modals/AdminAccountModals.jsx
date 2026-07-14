import { useState } from 'react'
import { createAdminCourse, getAdminMajors, updateAdminCourse } from '../../adminService'
import { useAdminResource as useAdminList } from '../../hooks/useAdminResource'
import { readCourseMajors } from '../../utils/adminNormalizers'
import { formatDate, getInitial } from '../../utils/adminFormatters'
import { runAdminAction } from '../../utils/adminActions'
import { InfoBlock } from '../../../../pages/study-hub/shared'

export function AdminUserModal({ onClose, user }) {
  return (
    <div className="admin-modal-backdrop">
      <section className="admin-user-modal">
        <button className="admin-modal-close" onClick={onClose} type="button">x</button>
        <h2>Account Details</h2>
        <div className="admin-user-profile"><span>{getInitial(user.fullName || user.email)}</span><div><h3>{user.fullName || user.email}</h3><p>Joined: {formatDate(user.createdAt)}</p></div></div>
        <div className="admin-detail-grid">
          <InfoBlock label="Email" value={user.email || '-'} />
          <InfoBlock label="Student Code" value={user.studentCode || '-'} />
          <InfoBlock label="Verification" value={user.verificationStatus || '-'} />
          <InfoBlock label="Role" value={user.roleName || '-'} />
          <InfoBlock label="Plan" value={user.planName || '-'} />
        </div>
        <footer><p><small>Account Status</small><strong className="green-text">{user.status || '-'}</strong></p></footer>
      </section>
    </div>
  )
}


export function AdminCourseModal({ course = {}, mode, onClose, onSaved }) {
  const edit = mode === 'edit'
  const majors = useAdminList(getAdminMajors)
  const hasMajors = majors.data.length > 0
  const initialMajorIds = readCourseMajors(course).map((major) => String(major.id)).filter(Boolean)
  const [form, setForm] = useState(() => ({
    courseCode: course.courseCode || '',
    courseName: course.courseName || '',
    description: course.description || '',
    majorIds: initialMajorIds,
    isActive: course.isActive ?? true,
  }))

  const submit = async (event) => {
    event.preventDefault()
    const majorIds = form.majorIds.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    const payload = { ...form, majorIds, majorId: majorIds[0] || null }
    await runAdminAction(
      () => (edit ? updateAdminCourse(course.id, payload) : createAdminCourse(payload)),
      onSaved,
      edit ? 'Course updated' : 'Course created',
    )
    onClose()
  }

  return (
    <div className="admin-modal-backdrop">
      <form className="admin-course-modal" onSubmit={submit}>
        <button className="admin-modal-close" onClick={onClose} type="button">x</button>
        <h2>{edit ? 'Edit Subject' : 'Add New Subject'}</h2>
        <label>Course Code<input onChange={(e) => setForm({ ...form, courseCode: e.target.value })} placeholder="e.g. CEA201" required value={form.courseCode} /></label>
        <label>Course Name<input onChange={(e) => setForm({ ...form, courseName: e.target.value })} placeholder="e.g. Computer Architecture" required value={form.courseName} /></label>
        <label>Description<input onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" value={form.description} /></label>
        <label>
          Majors
          <select
            className="admin-multi-select"
            disabled={majors.loading || Boolean(majors.error) || !hasMajors}
            multiple
            onChange={(e) => setForm({ ...form, majorIds: Array.from(e.target.selectedOptions, (option) => option.value) })}
            required
            size={Math.min(Math.max(majors.data.length, 8), 12)}
            value={form.majorIds}
          >
            {majors.data.map((major) => <option key={major.id} value={major.id}>{major.majorCode} - {major.majorName}</option>)}
          </select>
          {!majors.loading && !majors.error && hasMajors && <small className="admin-field-help">Hold Ctrl or Shift to choose multiple majors. You can also drag the bottom edge to expand this list.</small>}
          {majors.error && <small className="admin-field-error">{majors.error}</small>}
          {!majors.loading && !majors.error && !hasMajors && <small className="admin-field-error">Please create a major in Settings first.</small>}
        </label>
        <footer><button onClick={onClose} type="button">Cancel</button><button className="dark-button" type="submit">{edit ? 'Update' : 'Add Subject'}</button></footer>
      </form>
    </div>
  )
}
