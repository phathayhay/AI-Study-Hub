import { apiGet, apiPost } from './api'

export function getActiveSubscriptionPlans() {
  return apiGet('/api/subscriptions/plans')
}

export function getBillingHistory() {
  return apiGet('/api/subscriptions/history')
}

export function getUpgradePaymentInfo(planId) {
  return apiPost('/api/subscriptions/upgrade', { planId: Number(planId) })
}

export function simulatePaymentSuccess(planId, transferContent) {
  return apiPost('/api/subscriptions/simulate-payment', {
    planId: Number(planId),
    transferContent,
  })
}
