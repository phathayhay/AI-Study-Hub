export function callToast(message, tone = 'success') {
  window.showToast?.(message, tone)
}

export async function runAdminAction(action, refresh, successMessage) {
  try {
    await action()
    window.showToast?.(successMessage)
    await refresh?.()
  } catch (error) {
    window.showToast?.(error.message || 'Admin action failed', 'error')
  }
}
