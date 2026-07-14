import { useState } from 'react'
import { createAdminPlan, updateAdminPlan } from '../../adminService'
import { runAdminAction, callToast } from '../../utils/adminActions'

export function AdminPlanModal({ mode, onClose, onSaved, plan = null }) {
  const edit = mode === 'edit'
  const [form, setForm] = useState(() => ({
    planName: plan?.planName || '',
    description: plan?.description || '',
    price: String(plan?.price ?? 0),
    storageLimitMb: String(plan?.storageLimitMb ?? 50),
    aiRequestsPerDay: String(plan?.aiRequestsPerDay ?? 10),
    durationDays: String(plan?.durationDays ?? 30),
    canUseAiSummary: plan?.canUseAiSummary ?? true,
    canUseFlashcards: plan?.canUseFlashcards ?? true,
    canUseQuizzes: plan?.canUseQuizzes ?? true,
    canPublishDocuments: plan?.canPublishDocuments ?? false,
    canPublishFolders: plan?.canPublishFolders ?? false,
    isActive: plan?.isActive ?? true,
  }))

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    const payload = {
      planName: form.planName.trim().toUpperCase(),
      description: form.description.trim(),
      price: Number(form.price || 0),
      storageLimitMb: Number(form.storageLimitMb || 0),
      aiRequestsPerDay: Number(form.aiRequestsPerDay || 0),
      durationDays: Number(form.durationDays || 30),
      canUseAiSummary: Boolean(form.canUseAiSummary),
      canUseFlashcards: Boolean(form.canUseFlashcards),
      canUseQuizzes: Boolean(form.canUseQuizzes),
      canPublishDocuments: Boolean(form.canPublishDocuments),
      canPublishFolders: Boolean(form.canPublishFolders),
      isActive: Boolean(form.isActive),
    }

    if (!payload.planName || payload.storageLimitMb <= 0 || payload.durationDays <= 0) {
      callToast('Please fill in the required plan details.', 'error')
      return
    }

    await runAdminAction(
      () => (edit ? updateAdminPlan(plan.id, payload) : createAdminPlan(payload)),
      onSaved,
      edit ? 'Plan updated' : 'Plan created',
    )
  }

  const rights = [
    ['canUseAiSummary', 'AI Summary', 'Allow summary generation'],
    ['canUseFlashcards', 'AI Flashcards', 'Allow flashcard generation'],
    ['canUseQuizzes', 'AI Quizzes', 'Allow quiz generation'],
    ['canPublishDocuments', 'Public Documents', 'Allow publishing individual documents'],
    ['canPublishFolders', 'Public Folders', 'Allow publishing public folders'],
    ['isActive', 'Plan Active', 'Make this plan available to users'],
  ]

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <form className="admin-plan-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <button className="admin-modal-close" onClick={onClose} type="button">x</button>
        <header className="admin-plan-modal__header">
          <h2>{edit ? `Edit ${plan?.planName || 'Plan'}` : 'Create New Plan'}</h2>
          <p>Configure pricing, capacity, and feature access in one place.</p>
        </header>

        <div className="admin-plan-modal__content">
          <div className="admin-plan-modal__grid">
            <label>
              Plan Name
              <input
                onChange={(event) => updateField('planName', event.target.value)}
                placeholder="FREE / PRO / PREMIUM"
                required
                value={form.planName}
              />
            </label>
            <label>
              Monthly Price (VND)
              <input
                min="0"
                onChange={(event) => updateField('price', event.target.value)}
                type="number"
                value={form.price}
              />
            </label>
            <label className="admin-plan-modal__full">
              Description
              <textarea
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Short plan description"
                rows={3}
                value={form.description}
              />
            </label>
            <label>
              Storage Limit (MB)
              <input
                min="1"
                onChange={(event) => updateField('storageLimitMb', event.target.value)}
                required
                type="number"
                value={form.storageLimitMb}
              />
            </label>
            <label>
              AI Requests / Day
              <input
                min="0"
                onChange={(event) => updateField('aiRequestsPerDay', event.target.value)}
                required
                type="number"
                value={form.aiRequestsPerDay}
              />
            </label>
            <label>
              Duration (days)
              <input
                min="1"
                onChange={(event) => updateField('durationDays', event.target.value)}
                required
                type="number"
                value={form.durationDays}
              />
            </label>
          </div>

          <section className="admin-plan-rights">
            <div className="admin-plan-rights__heading">
              <strong>Plan Rights</strong>
              <small>Toggle exactly what this package unlocks.</small>
            </div>
            <div className="admin-plan-rights__list">
              {rights.map(([key, title, hint]) => (
                <label className="admin-plan-toggle" key={key}>
                  <div>
                    <strong>{title}</strong>
                    <small>{hint}</small>
                  </div>
                  <input
                    checked={Boolean(form[key])}
                    onChange={(event) => updateField(key, event.target.checked)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="admin-plan-preview">
            <strong>Quick Preview</strong>
            <small>{form.description || 'No description yet.'}</small>
            <div className="admin-plan-preview__meta">
              <span>{Number(form.price || 0).toLocaleString('en-US')} VND</span>
              <span>{form.storageLimitMb || 0} MB</span>
              <span>{form.aiRequestsPerDay || 0} AI/day</span>
              <span>{form.durationDays || 30} days</span>
            </div>
          </section>
        </div>

        <footer className="admin-plan-modal__footer">
          <button onClick={onClose} type="button">Cancel</button>
          <button className="dark-button" type="submit">{edit ? 'Save Plan' : 'Create Plan'}</button>
        </footer>
      </form>
    </div>
  )
}


