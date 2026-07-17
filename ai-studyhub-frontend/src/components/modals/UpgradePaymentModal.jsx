import { useEffect, useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import { getUserProfile } from '../../services/userService'
import { getPaymentStatus } from '../../services/subscriptionService'

export function UpgradePaymentModal({ onClose, user, plan, paymentInfo, onUpgradeSuccess }) {
  const [checking, setChecking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(paymentInfo?.paymentStatus || 'PENDING')
  const [statusMessage, setStatusMessage] = useState('Waiting for the bank transfer confirmation.')
  const currentPlanName = paymentInfo?.currentPlanName || user?.planName || 'FREE'
  const fullPrice = Number(paymentInfo?.targetPlanPrice || paymentInfo?.amount || 0)
  const currentPlanPrice = Number(paymentInfo?.currentPlanPrice || 0)
  const amountDue = Number(paymentInfo?.amount || 0)
  const remainingDays = Number(paymentInfo?.remainingDays || 0)
  const billingCycleDays = Number(paymentInfo?.billingCycleDays || 0)
  const expiresAt = paymentInfo?.expiresAt ? new Date(paymentInfo.expiresAt) : null
  const currentPeriodEndDate = paymentInfo?.currentPeriodEndDate ? new Date(paymentInfo.currentPeriodEndDate) : null

  const finishUpgrade = async (message) => {
    setSuccess(true)
    setPaymentStatus('PAID')
    setStatusMessage(message || 'Payment confirmed. Your plan is active.')
    window.showToast?.(message || 'Your account has been upgraded successfully.', 'success')

    const profileRes = await getUserProfile()
    if (profileRes?.success && profileRes?.data) {
      onUpgradeSuccess?.(profileRes.data)
    }
  }

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    window.showToast?.(`${fieldName} copied.`, 'success')
    setTimeout(() => setCopiedField(null), 2000)
  }

  const checkStatus = async (silent = false) => {
    if (!paymentInfo?.paymentCode) return

    setChecking(true)
    try {
      const res = await getPaymentStatus(paymentInfo.paymentCode)
      const data = res?.data

      if (!res?.success || !data) {
        if (!silent) {
          window.showToast?.(res?.message || 'Unable to check payment status right now.', 'error')
        }
        return
      }

      setPaymentStatus(data.status)
      setStatusMessage(data.message || 'Waiting for the bank transfer confirmation.')

      if (data.status === 'PAID') {
        await finishUpgrade(data.message)
      } else if (!silent) {
        window.showToast?.(data.message || `Current payment status: ${data.status}`, data.status === 'FAILED' ? 'error' : 'info')
      }
    } catch (err) {
      if (!silent) {
        window.showToast?.(err.message || 'Unable to check payment status right now.', 'error')
      }
    } finally {
      setChecking(false)
    }
  }

  const openSandboxCheckout = () => {
    if (!paymentInfo?.checkoutUrl) {
      window.showToast?.('Sandbox checkout is not available for this order.', 'error')
      return
    }
    window.location.assign(paymentInfo.checkoutUrl)
  }

  useEffect(() => {
    if (!paymentInfo?.paymentCode || success) return undefined

    const intervalId = window.setInterval(() => {
      checkStatus(true)
    }, 8000)

    return () => window.clearInterval(intervalId)
  }, [paymentInfo?.paymentCode, success])

  if (paymentInfo?.paymentUrl) {
    const vnpayExpiry = paymentInfo.expiresAt ? new Date(paymentInfo.expiresAt) : null
    return (
      <div className="modal-backdrop" style={{ zIndex: 1000 }} onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}>
        <section className="settings-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700" style={{ width: 'min(92vw, 520px)', overflow: 'hidden' }}>
          <header className="border-b border-slate-100 dark:border-slate-700" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px' }}>
            <h2 className="text-slate-900 dark:text-white" style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 9 }}>
              <StudyHubIcon name="shield" size={20} /> Confirm upgrade
            </h2>
            <button aria-label="Close" onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', fontSize: 20, color: '#64748b' }} type="button">x</button>
          </header>
          <div style={{ padding: 22, display: 'grid', gap: 16 }}>
            <div style={{ padding: 14, borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', lineHeight: 1.55 }}>
              You will continue to VNPAY Sandbox to select a test payment method. No production payment credentials are used.
            </div>
            <div style={{ display: 'grid', gap: 12, padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Plan</span><strong>{paymentInfo.planName || plan?.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Order</span><strong style={{ fontFamily: 'monospace' }}>{paymentInfo.orderCode}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}><span style={{ color: '#64748b' }}>Amount due</span><strong style={{ fontSize: 22 }}>{Number(paymentInfo.amount || 0).toLocaleString('en-US')} {paymentInfo.currency || 'VND'}</strong></div>
              {vnpayExpiry && <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><span style={{ color: '#64748b' }}>Checkout expires</span><strong>{vnpayExpiry.toLocaleString('en-GB')}</strong></div>}
            </div>
          </div>
          <footer style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '16px 22px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }} type="button">Cancel</button>
            <button onClick={() => window.location.assign(paymentInfo.paymentUrl)} style={{ padding: '10px 18px', borderRadius: 8, border: 0, background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 }} type="button">Continue to VNPAY</button>
          </footer>
        </section>
      </div>
    )
  }

  const statusTone = paymentStatus === 'PAID'
    ? { bg: '#ecfdf5', border: '#bbf7d0', text: '#047857' }
    : paymentStatus === 'FAILED'
      ? { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' }
      : paymentStatus === 'EXPIRED' || paymentStatus === 'CANCELLED'
        ? { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' }
        : { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }

  return (
    <div className="modal-backdrop" style={{ zIndex: 1000 }}>
      <section className="settings-modal bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors duration-300 ease-in-out" style={{ width: '100%', maxWidth: '680px', overflow: 'hidden' }}>
        <header className="border-b border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h2 className="text-slate-900 dark:text-white transition-colors duration-300" style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#6366f1', display: 'inline-flex' }}>
              <StudyHubIcon name="star" size={20} />
            </span>
            Upgrade Plan: {plan.name}
          </h2>
          {!success && (
            <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200" style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }} type="button">x</button>
          )}
        </header>

        <div className="settings-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
          {success ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', textAlign: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                OK
              </div>
              <h3 className="text-slate-900 dark:text-white" style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Upgrade Successful!</h3>
              <p className="text-slate-600 dark:text-slate-300" style={{ margin: 0, fontSize: '14.5px', maxWidth: '380px', lineHeight: '22px' }}>
                Your account has been upgraded to the <strong>{plan.name}</strong> plan. You can start using the premium features right away.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 transition-colors duration-300" style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '13px', lineHeight: '18px' }}>
                The system creates a real payment request for this upgrade. Transfer the exact amount with the exact description below, then wait for the banking webhook to confirm it automatically.
              </div>

              <div style={{ backgroundColor: statusTone.bg, border: `1px solid ${statusTone.border}`, color: statusTone.text, borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <strong style={{ fontSize: '13px' }}>Payment status: {paymentStatus}</strong>
                  <span style={{ fontSize: '12px', lineHeight: '18px' }}>{statusMessage}</span>
                </div>
                {expiresAt && (
                  <span style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    Expires: {expiresAt.toLocaleString('en-GB')}
                  </span>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 transition-colors duration-300" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', padding: '14px 16px', borderRadius: '12px' }}>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Current plan</span>
                    <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>{currentPlanName}</strong>
                  </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Target plan</span>
                  <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>{paymentInfo.planName}</strong>
                </div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Full plan price</span>
                    <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>{fullPrice.toLocaleString('en-US')} VND</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Current plan price</span>
                    <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>{currentPlanPrice.toLocaleString('en-US')} VND</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Remaining days</span>
                    <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>
                      {remainingDays > 0 ? `${remainingDays} day${remainingDays > 1 ? 's' : ''}` : 'No active days left'}
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Billing cycle</span>
                    <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>
                      {billingCycleDays > 0 ? `${billingCycleDays} days` : `${paymentInfo?.durationDays || 30} days`}
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Current period ends</span>
                    <strong className="text-slate-900 dark:text-white" style={{ fontSize: '14px' }}>
                      {currentPeriodEndDate && !Number.isNaN(currentPeriodEndDate.getTime())
                        ? currentPeriodEndDate.toLocaleDateString('en-GB')
                        : 'A new 30-day cycle starts after payment'}
                    </strong>
                  </div>
                  <div style={{ display: 'grid', gap: '4px', gridColumn: '1 / -1' }}>
                    <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 600 }}>Amount due now</span>
                  <strong className="text-slate-950 dark:text-white" style={{ fontSize: '18px' }}>{amountDue.toLocaleString('en-US')} VND</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '190px', height: '190px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <img
                      src={paymentInfo.qrCodeUrl}
                      alt="TPBank Payment Code"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=TPBank%20${paymentInfo.accountNumber}%20${paymentInfo.amount}`
                      }}
                    />
                  </div>
                  <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="ping-dot" style={{ display: 'inline-block', width: '6px', height: '6px', backgroundColor: '#3b82f6', borderRadius: '50%' }} />
                    Scan the QR code for faster payment
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    ['Bank', paymentInfo.bankName, null],
                    ['Account number', paymentInfo.accountNumber, 'Account number'],
                    ['Account name', paymentInfo.accountName, null],
                    ['Transfer amount', `${amountDue.toLocaleString('en-US')} VND`, 'Transfer amount'],
                    ['Payment code', paymentInfo.paymentCode, 'Payment code'],
                    ['Payment description (must match exactly)', paymentInfo.transferContent, 'Payment description']
                  ].map(([label, value, copyField]) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="text-slate-500 dark:text-slate-400" style={{ fontSize: '12px', fontWeight: 500 }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: label.includes('description') ? '#fffbeb' : '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${label.includes('description') ? '#fef3c7' : '#e2e8f0'}` }} className={label.includes('description') ? 'dark:bg-amber-950/20 dark:border-amber-900/50' : 'dark:bg-slate-900 dark:border-slate-700'}>
                        <span className={`font-semibold ${label.includes('description') ? 'text-amber-800 dark:text-amber-300 font-mono' : 'text-slate-800 dark:text-slate-200'} ${label.includes('Account number') || label.includes('Payment code') ? 'font-mono' : ''}`} style={{ fontSize: '13.5px' }}>{value}</span>
                        {copyField && (
                          <button
                            onClick={() => handleCopy(label === 'Transfer amount' ? String(paymentInfo.amount) : String(value), copyField)}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: label.includes('description') ? '#d97706' : '#6366f1', fontSize: '12px', fontWeight: 600 }}
                            type="button"
                          >
                            {copiedField === copyField ? 'Copied' : 'Copy'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 transition-colors duration-300" style={{ display: 'flex', justifyContent: success ? 'flex-end' : 'space-between', padding: '16px 24px', gap: '12px' }}>
          {success ? (
            <button
              onClick={onClose}
              className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 cursor-pointer"
              style={{ padding: '8px 24px', borderRadius: '8px', border: 'none' }}
              type="button"
            >
              Done
            </button>
          ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={openSandboxCheckout}
                    disabled={checking || !paymentInfo?.checkoutUrl}
                    className="bg-[#6366f1] hover:bg-indigo-700 text-white font-semibold transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none' }}
                    type="button"
                  >
                    Open sandbox checkout
                  </button>
                  <button
                    onClick={() => checkStatus(false)}
                    disabled={checking}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                    style={{ padding: '8px 18px', borderRadius: '8px', border: 'none' }}
                    type="button"
                  >
                    {checking ? 'Checking...' : "I've transferred - Check status"}
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200 cursor-pointer"
                  style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', fontWeight: 500 }}
                  type="button"
                >
                  Close
                </button>
              </>
            )}
        </footer>
      </section>
      <style>{`
        .ping-dot {
          animation: ping-anim 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping-anim {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
