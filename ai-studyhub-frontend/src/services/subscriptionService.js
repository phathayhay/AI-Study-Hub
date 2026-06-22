import { apiGet, apiPost } from './api'

/**
 * Get active subscription plans
 * Retrieves a list of all active subscription plans (FREE, PRO, PREMIUM) with pricing, storage, and AI request limits.
 * Method: GET
 * Path: /api/subscriptions/plans
 */
export function getActivePlans() {
  return apiGet(`/subscriptions/plans`);
}

/**
 * Get billing history
 * Retrieves all subscription billing and plan usage logs for the currently logged-in user.
 * Method: GET
 * Path: /api/subscriptions/history
 */
export function getBillingHistory() {
  return apiGet(`/subscriptions/history`);
}

/**
 * Get plan upgrade payment info
 * Requests checkout information for upgrading a plan. Returns dynamic VietQR transfer bank details and dynamic code image URL.
 * Method: POST
 * Path: /api/subscriptions/upgrade
 * @param {any} body - Request body
 */
export function getUpgradePaymentInfo(body) {
  return apiPost(`/subscriptions/upgrade`, body);
}

/**
 * Simulate payment webhook/callback success
 * Simulates successful transfer receipt to instantly upgrade user's active plan.
 * Method: POST
 * Path: /api/subscriptions/simulate-payment
 * @param {any} body - Request body
 */
export function simulatePaymentSuccess(body) {
  return apiPost(`/subscriptions/simulate-payment`, body);
}
