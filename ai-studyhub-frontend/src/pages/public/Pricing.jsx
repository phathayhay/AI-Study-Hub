import { useEffect, useState } from 'react'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { PageTitle } from '../study-hub/shared'
import { pricingPlans } from '../study-hub/config'
import { createVnpayCheckout, getActivePlans } from '../../services/subscriptionService'

export function PricingPage({ onNavigate, user, onSelectUpgrade }) {
  const [plans, setPlans] = useState([])
  const [loadingPlanId, setLoadingPlanId] = useState(null)

  useEffect(() => {
    getActivePlans()
      .then(res => {
        if (res?.success && Array.isArray(res?.data)) {
          setPlans(res.data)
        }
      })
      .catch(err => {
        console.error('Failed to fetch active plans:', err)
      })
  }, [])

  const currentPlan = user?.planName?.toUpperCase() || 'FREE'

  const handleUpgrade = async (plan, backendId) => {
    if (!user) {
      window.showToast?.('Vui lòng đăng nhập để nâng cấp gói tài khoản!', 'info')
      onNavigate('login')
      return
    }

    if (!backendId) {
      window.showToast?.('Không tìm thấy thông tin gói này trên hệ thống!', 'error')
      return
    }

    setLoadingPlanId(backendId)
    try {
      const res = await createVnpayCheckout(backendId)
      if (res?.success && res?.data) {
        onSelectUpgrade?.(plan, res.data)
      } else {
        window.showToast?.('Không thể lấy thông tin thanh toán!', 'error')
      }
    } catch (err) {
      window.showToast?.(err.message || 'Lỗi kết nối khi lấy thông tin thanh toán!', 'error')
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <main className="page-surface pricing-page">
      <button aria-label="Back" className="back-pill cursor-pointer" onClick={() => onNavigate('library')} type="button">
        <StudyHubIcon name="arrow-left" size={18} />
      </button>
      <PageTitle title="Choose the Plan That's Right for You" subtitle="Upgrade to experience all AI learning features" centered />
      <button className="billing-pill cursor-pointer" type="button">Monthly</button>
      <div className="pricing-grid">
        {pricingPlans.map((plan) => {
          const backendPlan = plans.find(p => p.planName?.toUpperCase() === plan.id.toUpperCase())
          const backendId = backendPlan?.id
          
          const priceDisplay = backendPlan 
            ? (backendPlan.price === 0 ? '0đ' : `${Number(backendPlan.price).toLocaleString('vi-VN')}đ`)
            : plan.price

          let buttonText = ''
          let isBtnDisabled = false

          if (plan.id === 'free') {
            if (currentPlan === 'FREE') {
              buttonText = 'Current Plan'
              isBtnDisabled = true
            } else {
              buttonText = 'Get Started for Free'
              isBtnDisabled = true
            }
          } else {
            const planUpper = plan.id.toUpperCase()
            if (currentPlan === planUpper) {
              buttonText = 'Current Plan'
              isBtnDisabled = true
            } else if (currentPlan === 'PREMIUM' && planUpper === 'PRO') {
              buttonText = 'Pro Plan (Downgrade not supported)'
              isBtnDisabled = true
            } else {
              buttonText = loadingPlanId === backendId ? 'Processing...' : `Upgrade to ${plan.name} →`
              isBtnDisabled = loadingPlanId !== null
            }
          }

          return (
            <article className={`pricing-card pricing-card--${plan.tone}`} key={plan.id}>
              {plan.popular && <span className="popular-ribbon">Most Popular</span>}
              <span className="plan-icon"><StudyHubIcon name={plan.id === 'free' ? 'star' : 'book'} size={30} /></span>
              <h2>{plan.name}</h2>
              <p>{backendPlan?.description || plan.subtitle}</p>
              <strong>{priceDisplay}<small>/month</small></strong>
              <ul>
                {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                {plan.disabled.map((feature) => <li className="disabled" key={feature}>× {feature}</li>)}
              </ul>
              <button 
                className={plan.id === 'premium' ? 'purple-button cursor-pointer' : 'primary-action cursor-pointer'} 
                disabled={isBtnDisabled} 
                onClick={() => handleUpgrade(plan, backendId)}
                type="button"
              >
                {buttonText}
              </button>
            </article>
          )
        })}
      </div>
      <section className="faq-card">
        <h2>Frequently Asked Questions</h2>
        {[
          'Can I cancel at any time?',
          'What payment methods are accepted?',
          'Can I get a refund?',
          'Can I upgrade or downgrade my plan?',
        ].map((question) => (
          <div key={question}>
            <h3>{question}</h3>
            <p>Yes, you can change or cancel at any time. Fees are calculated based on usage duration.</p>
          </div>
        ))}
      </section>
    </main>
  )
}
