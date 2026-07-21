import { useState } from 'react'
import StudyHubIcon from '../../../components/icons/StudyHubIcons'
import { createAdminCategory, createAdminMajor, createAdminPlan, deleteAdminCategory, deleteAdminMajor, deleteAdminPlan, getAdminCategories, getAdminMajors, getAdminPlans, getPendingVerifications, reviewVerification, updateAdminCategory, updateAdminMajor, updateAdminPlan } from '../../../features/admin/adminService'
import { useAdminResource as useAdminList } from '../../../features/admin/hooks/useAdminResource'
import { runAdminAction } from '../../../features/admin/utils/adminActions'
import { AdminPlanModal, AdminTableState } from '../../../features/admin/components/legacyShared'
import { getRenderableCloudinaryImage } from '../../../features/admin/utils/adminFormatters'
import { useLanguage } from '../../../context/LanguageContext'
import { getTranslatedMajorDesc, getTranslatedMajorName } from '../../../i18n/translatedContent'

export function AdminSettings() {
  const { t } = useLanguage()
  const plans = useAdminList(getAdminPlans)
  const majors = useAdminList(getAdminMajors)
  const categories = useAdminList(getAdminCategories)
  const verifications = useAdminList(getPendingVerifications)
  const [previewVerification, setPreviewVerification] = useState(null)
  const [planModal, setPlanModal] = useState(null)

  return (
    <main className="admin-page settings-page">
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="sparkle" size={18} /> {t('lookupConfigTitle')}</h2>
        <LookupRows
          fields={['majorCode', 'majorName', 'description']}
          items={majors.data}
          labelKey="majorName"
          loading={majors.loading}
          onCreate={() => createLookup('major', majors.reload)}
          onDelete={(item) => runAdminAction(() => deleteAdminMajor(item.id), majors.reload, 'Major deleted')}
          onUpdate={(item) => updateLookup('major', item, majors.reload)}
          title={t('majorsTitle')}
        />
        <LookupRows
          fields={['categoryName']}
          items={categories.data}
          labelKey="categoryName"
          loading={categories.loading}
          onCreate={() => createLookup('category', categories.reload)}
          onDelete={(item) => runAdminAction(() => deleteAdminCategory(item.id), categories.reload, 'Category deleted')}
          onUpdate={(item) => updateLookup('category', item, categories.reload)}
          title={t('categoriesTitle')}
        />
        <LookupRows
          fields={['planName', 'price', 'storageLimitMb', 'aiRequestsPerDay', 'durationDays']}
          items={plans.data}
          labelKey="planName"
          loading={plans.loading}
          onCreate={() => setPlanModal({ mode: 'create', item: null })}
          onDelete={(item) => runAdminAction(() => deleteAdminPlan(item.id), plans.reload, 'Plan deleted')}
          onUpdate={(item) => setPlanModal({ mode: 'edit', item })}
          title={t('plansTitle')}
        />
      </section>
      <section className="admin-card settings-card">
        <h2><StudyHubIcon name="lock" size={18} /> {t('pendingVerificationsTitle')}</h2>
        <AdminTableState error={verifications.error} loading={verifications.loading} />
        {verifications.data.map((item) => {
          const imageUrl = getRenderableCloudinaryImage(item.imageUrl)
          return (
            <div className="setting-row" key={item.id}>
              <div className="verification-row-content">
                {imageUrl ? (
                  <button
                    className="verification-thumb-button"
                    onClick={() => setPreviewVerification(item)}
                    type="button"
                  >
                    <img
                      alt={`Student ID ${item.userFullName || item.userEmail || item.id}`}
                      className="verification-thumb-image"
                      src={imageUrl}
                    />
                  </button>
                ) : (
                  <div className="verification-thumb-placeholder" />
                )}
                <p>
                  <strong>{item.userFullName || item.userEmail || `Request #${item.id}`}</strong>
                  <small>{item.reviewNote || 'Student verification request'}</small>
                  {imageUrl && (
                    <button
                      className="verification-link-button"
                      onClick={() => setPreviewVerification(item)}
                      type="button"
                    >
                      View student ID image
                    </button>
                  )}
                </p>
              </div>
              <span className="admin-actions">
                <button onClick={() => runAdminAction(() => reviewVerification(item.id, 'APPROVED', 'Approved by admin'), verifications.reload, 'Verification approved')} type="button"><StudyHubIcon name="check" size={16} /></button>
                <button onClick={() => runAdminAction(() => reviewVerification(item.id, 'REJECTED', 'Rejected by admin'), verifications.reload, 'Verification rejected')} type="button"><StudyHubIcon name="x" size={16} /></button>
              </span>
            </div>
          )
        })}
      </section>
      {previewVerification && (
        <div className="admin-modal-backdrop" onClick={() => setPreviewVerification(null)}>
          <section className="admin-verification-modal" onClick={(event) => event.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setPreviewVerification(null)} type="button">x</button>
            <h2>Student ID Preview</h2>
            <div className="admin-verification-meta">
              <strong>{previewVerification.userFullName || previewVerification.userEmail || `Request #${previewVerification.id}`}</strong>
              <small>{previewVerification.userEmail || 'Student verification request'}</small>
            </div>
            {getRenderableCloudinaryImage(previewVerification.imageUrl) ? (
              <img
                alt={`Student ID ${previewVerification.userFullName || previewVerification.userEmail || previewVerification.id}`}
                className="admin-verification-preview-image"
                src={getRenderableCloudinaryImage(previewVerification.imageUrl)}
              />
            ) : (
              <div className="admin-verification-empty">No verification image available.</div>
            )}
            <footer>
              <a
                className="verification-link-button"
                href={getRenderableCloudinaryImage(previewVerification.imageUrl)}
                rel="noreferrer"
                target="_blank"
              >
                Open full image
              </a>
              <div className="admin-verification-actions">
                <button
                  onClick={() => {
                    runAdminAction(() => reviewVerification(previewVerification.id, 'APPROVED', 'Approved by admin'), verifications.reload, 'Verification approved')
                    setPreviewVerification(null)
                  }}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    runAdminAction(() => reviewVerification(previewVerification.id, 'REJECTED', 'Rejected by admin'), verifications.reload, 'Verification rejected')
                    setPreviewVerification(null)
                  }}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
      {planModal && (
        <AdminPlanModal
          mode={planModal.mode}
          plan={planModal.item}
          onClose={() => setPlanModal(null)}
          onSaved={async () => {
            await plans.reload()
            setPlanModal(null)
          }}
        />
      )}
    </main>
  )
}

async function createLookup(type, reload) {
  const body = promptLookup(type)
  if (!body) return
  const actions = {
    category: () => createAdminCategory(body),
    major: () => createAdminMajor(body),
    plan: () => createAdminPlan(body),
  }
  await runAdminAction(actions[type], reload, `${type} created`)
}

async function updateLookup(type, item, reload) {
  const body = promptLookup(type, item)
  if (!body) return
  const actions = {
    category: () => updateAdminCategory(item.id, body),
    major: () => updateAdminMajor(item.id, body),
    plan: () => updateAdminPlan(item.id, body),
  }
  await runAdminAction(actions[type], reload, `${type} updated`)
}

function promptLookup(type, item = {}) {
  if (type === 'category') {
    const categoryName = window.prompt('Category name', item.categoryName || '')
    if (!categoryName) return null
    return { categoryName }
  }
  if (type === 'major') {
    const majorCode = window.prompt('Major code', item.majorCode || '')
    if (!majorCode) return null
    const majorName = window.prompt('Major name', item.majorName || '')
    if (!majorName) return null
    const description = window.prompt('Description', item.description || '') || ''
    return { majorCode, majorName, description }
  }
  return null
}

function LookupRows({ fields, items, labelKey, loading, onCreate, onDelete, onUpdate, title }) {
  const { lang } = useLanguage()
  return (
    <div className="setting-row lookup-row">
      <p className="lookup-summary"><strong>{title}</strong><small>{loading ? 'Loading...' : `${items.length} records`}</small></p>
      <span className="admin-actions lookup-create">
        <button onClick={onCreate} type="button"><StudyHubIcon name="plus" size={16} /></button>
      </span>
      <div className="lookup-list">
        {items.map((item) => {
          const rawName = item[labelKey] || ''
          const titleText = item.majorCode ? getTranslatedMajorName(item.majorCode, rawName, lang) : rawName
          const rawSummary = fields.map((field) => item[field]).filter(Boolean).join(' - ')
          const summary = item.majorCode ? getTranslatedMajorDesc(item.majorCode, rawSummary, lang) : rawSummary
          return (
            <p className="lookup-item" key={item.id || item[labelKey]}>
              <strong>{titleText}</strong>
              <small>{summary}</small>
              <span className="admin-actions">
                <button onClick={() => onUpdate(item)} type="button"><StudyHubIcon name="edit" size={16} /></button>
                <button onClick={() => onDelete(item)} type="button"><StudyHubIcon name="archive" size={16} /></button>
              </span>
            </p>
          )
        })}
      </div>
    </div>
  )
}

export default AdminSettings

