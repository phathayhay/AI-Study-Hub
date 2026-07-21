import { useState } from 'react'
import { createAdminCourse, getAdminMajors, updateAdminCourse } from '../../adminService'
import { useAdminResource as useAdminList } from '../../hooks/useAdminResource'
import { readCourseMajors } from '../../utils/adminNormalizers'
import { formatDate, getInitial } from '../../utils/adminFormatters'
import { runAdminAction } from '../../utils/adminActions'
import { InfoBlock } from '../../../../pages/study-hub/shared'
import { useLanguage } from '../../../../context/LanguageContext'

export function AdminUserModal({ onClose, user }) {
  const { t } = useLanguage()
  return (
    <div className="admin-modal-backdrop">
      <section className="admin-user-modal">
        <button className="admin-modal-close" onClick={onClose} type="button">x</button>
        <h2>{t('accountDetails')}</h2>
        <div className="admin-user-profile"><span>{getInitial(user.fullName || user.email)}</span><div><h3>{user.fullName || user.email}</h3><p>{t('joinedDate')} {formatDate(user.createdAt)}</p></div></div>
        <div className="admin-detail-grid">
          <InfoBlock label={t('emailLabel')} value={user.email || '-'} />
          <InfoBlock label={t('studentCodeLabel')} value={user.studentCode || '-'} />
          <InfoBlock label={t('verificationLabel')} value={user.verificationStatus || '-'} />
          <InfoBlock label={t('roleLabel')} value={user.roleName || '-'} />
          <InfoBlock label={t('planLabel')} value={user.planName || '-'} />
        </div>
        <footer><p><small>{t('accountStatusLabel')}</small><strong className="green-text">{user.status || '-'}</strong></p></footer>
      </section>
    </div>
  )
}

export function AdminCourseModal({ course = {}, mode, onClose, onSaved }) {
  const { t } = useLanguage()
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
        <h2>{edit ? t('edit') : t('addSubject')}</h2>
        <label>{t('courseCodeLabelForm')}<input onChange={(e) => setForm({ ...form, courseCode: e.target.value })} placeholder="e.g. CEA201" required value={form.courseCode} /></label>
        <label>{t('courseLabel')}<input onChange={(e) => setForm({ ...form, courseName: e.target.value })} placeholder="e.g. Computer Architecture" required value={form.courseName} /></label>
        <label>{t('descriptionLabel')}<input onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" value={form.description} /></label>
        <label>
          {t('majorsTitle')}
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
          {!majors.loading && !majors.error && hasMajors && <small className="admin-field-help">Hold Ctrl or Shift to choose multiple majors.</small>}
          {majors.error && <small className="admin-field-error">{majors.error}</small>}
          {!majors.loading && !majors.error && !hasMajors && <small className="admin-field-error">Please create a major in Settings first.</small>}
        </label>
        <footer><button onClick={onClose} type="button">{t('cancel')}</button><button className="dark-button" type="submit">{edit ? t('save') : t('addSubject')}</button></footer>
      </form>
    </div>
  )
}
