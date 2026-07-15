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
 * Get subscription payment status
 * Retrieves the current status of a subscription payment request for the authenticated user.
 * Method: GET
 * Path: /api/subscriptions/payments/{paymentCode}
 */
export function getPaymentStatus(paymentCode) {
  return apiGet(`/subscriptions/payments/${paymentCode}`);
}

/**
 * Demo payment confirmation
 * Simulates a successful payment callback so the plan is upgraded immediately for demo/testing.
 * Method: POST
 * Path: /api/subscriptions/simulate-payment
 */
export function simulatePaymentSuccess(body) {
  return apiPost(`/subscriptions/simulate-payment`, body);
}
