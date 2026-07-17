import { useEffect, useMemo, useRef, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { completeSandboxPayment, getCurrentSubscription, getPaymentStatus } from '../../services/subscriptionService'

const shellStyle = {
  minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px 16px',
  background: '#f4f7fb', color: '#0f172a',
}

const cardStyle = {
  width: 'min(560px, 100%)', background: '#fff', border: '1px solid #dbe3ef',
  borderRadius: '8px', padding: '28px', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.10)',
}

const buttonStyle = (tone) => ({
  border: 'none', borderRadius: '8px', padding: '11px 16px', color: '#fff', fontWeight: 700,
  cursor: 'pointer', background: tone, minWidth: '112px',
})

export function SandboxPaymentPage({ onNavigate }) {
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const orderCode = params.get('orderCode') || ''
  const token = params.get('token') || ''
  const [submitting, setSubmitting] = useState('')
  const [error, setError] = useState('')

  const submitOutcome = async (outcome) => {
    if (!orderCode || !token || submitting) return
    setSubmitting(outcome)
    setError('')
    try {
      await completeSandboxPayment(orderCode, { token, outcome })
      window.location.assign(`/payment-result?orderCode=${encodeURIComponent(orderCode)}`)
    } catch (err) {
      setError(err.message || 'The sandbox payment could not be processed.')
      setSubmitting('')
    }
  }

  return (
    <main style={shellStyle}>
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ width: 44, height: 44, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#eef2ff', color: '#4f46e5' }}>
            <StudyHubIcon name="card" size={22} />
          </span>
          <div><h1 style={{ margin: 0, fontSize: 24 }}>Sandbox Checkout</h1><p style={{ margin: '4px 0 0', color: '#64748b' }}>No real money will be charged.</p></div>
        </div>
        <div style={{ padding: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 18 }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>Order code</span>
          <strong style={{ display: 'block', marginTop: 4, fontFamily: 'monospace', overflowWrap: 'anywhere' }}>{orderCode || 'Invalid order'}</strong>
        </div>
        {error && <p role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: 12, borderRadius: 8 }}>{error}</p>}
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Choose a provider outcome to test the complete server-side payment flow.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button style={buttonStyle('#059669')} disabled={!!submitting} onClick={() => submitOutcome('SUCCESS')}> {submitting === 'SUCCESS' ? 'Processing...' : 'Pay successfully'} </button>
          <button style={buttonStyle('#dc2626')} disabled={!!submitting} onClick={() => submitOutcome('FAILED')}>Fail</button>
          <button style={buttonStyle('#64748b')} disabled={!!submitting} onClick={() => submitOutcome('CANCELLED')}>Cancel</button>
          <button style={buttonStyle('#d97706')} disabled={!!submitting} onClick={() => submitOutcome('EXPIRED')}>Expire</button>
        </div>
        <button type="button" onClick={() => onNavigate('pricing')} style={{ marginTop: 22, border: 0, background: 'transparent', color: '#4f46e5', cursor: 'pointer', fontWeight: 600 }}>Back to plans</button>
      </section>
    </main>
  )
}

export function PaymentResultPage({ onNavigate, onPaymentConfirmed }) {
  const orderCode = useMemo(() => new URLSearchParams(window.location.search).get('orderCode') || '', [])
  const [payment, setPayment] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [error, setError] = useState(() => orderCode ? '' : 'The payment order code is missing.')
  const confirmationCallback = useRef(onPaymentConfirmed)

  useEffect(() => {
    confirmationCallback.current = onPaymentConfirmed
  }, [onPaymentConfirmed])

  useEffect(() => {
    let mounted = true
    let timer
    const load = async () => {
      try {
        const response = await getPaymentStatus(orderCode)
        if (!mounted) return
        const next = response?.data
        setPayment(next)
        if (next?.status === 'PAID') {
          const current = await getCurrentSubscription()
          if (!mounted) return
          setSubscription(current?.data || null)
          await confirmationCallback.current?.()
        } else if (!next?.finalStatus) {
          timer = window.setTimeout(load, 2000)
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Unable to verify this payment.')
      }
    }
    if (orderCode) load()
    return () => { mounted = false; if (timer) window.clearTimeout(timer) }
  }, [orderCode])

  const paid = payment?.status === 'PAID'
  const statusColor = paid ? '#059669' : payment?.finalStatus ? '#dc2626' : '#2563eb'
  return (
    <main style={shellStyle}>
      <section style={{ ...cardStyle, textAlign: 'center' }}>
        <span style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: `${statusColor}18`, color: statusColor }}>
          <StudyHubIcon name={paid ? 'check' : payment?.finalStatus ? 'close' : 'clock'} size={30} />
        </span>
        <h1 style={{ margin: '0 0 8px' }}>{paid ? 'Payment successful' : payment?.finalStatus ? `Payment ${payment.status.toLowerCase()}` : 'Verifying payment'}</h1>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>{error || payment?.message || 'Please wait while the server verifies your transaction.'}</p>
        {subscription && <div style={{ textAlign: 'left', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 16, borderRadius: 8, margin: '18px 0' }}>
          <strong>Your {subscription.planName} plan is now active</strong>
          <div style={{ color: '#475569', marginTop: 6 }}>Active until {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-GB') : 'no expiration'}</div>
        </div>}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20 }}>
          <button style={buttonStyle('#4f46e5')} onClick={() => onNavigate(paid ? 'explore' : 'pricing')}>{paid ? 'Continue studying' : 'Back to plans'}</button>
        </div>
      </section>
    </main>
  )
}
