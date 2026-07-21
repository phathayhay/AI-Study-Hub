import { useEffect, useState } from 'react'
import StudyHubIcon from '../icons/StudyHubIcons'
import { useLanguage } from '../../context/LanguageContext'

export default function VerificationBanner({ user, onOpenVerification }) {
  const { t } = useLanguage()
  const [timeLeft, setTimeLeft] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  const email = (user?.email || '').trim().toLowerCase()
  const isFptEmail = email.endsWith('@fpt.edu.vn') || email.endsWith('@fe.edu.vn')
  const vsMap = { APPROVED: 'verified', PENDING: 'pending', UNVERIFIED: 'unverified', REJECTED: 'rejected' }
  const verificationStatus = user?.verificationStatus ? vsMap[user.verificationStatus] : (localStorage.getItem('verificationStatus') || 'unverified')

  const isUnverifiedNonFpt = Boolean(user) && !isFptEmail && verificationStatus === 'unverified'

  useEffect(() => {
    if (!isUnverifiedNonFpt) return

    const userIdKey = user?.id || user?.email || 'guest'
    const storageKey = `user_verification_created_at_${userIdKey}`
    let createdTimestamp = Number(localStorage.getItem(storageKey))

    if (!createdTimestamp || Number.isNaN(createdTimestamp)) {
      if (user?.createdAt) {
        createdTimestamp = new Date(user.createdAt).getTime()
      } else {
        createdTimestamp = Date.now()
      }
      localStorage.setItem(storageKey, String(createdTimestamp))
    }

    const calculateTimeLeft = () => {
      const deadline = createdTimestamp + 3 * 24 * 60 * 60 * 1000
      const diff = deadline - Date.now()

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setIsExpired(false)
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const seconds = Math.floor((diff / 1000) % 60)
      setTimeLeft({ days, hours, minutes, seconds })
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [user, isUnverifiedNonFpt])

  if (!isUnverifiedNonFpt) return null

  return (
    <aside aria-label="Student verification deadline" className="verification-banner bg-slate-900 dark:bg-slate-950 text-slate-200 border-b border-indigo-900/40 shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm font-medium">
        <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="shrink-0 font-semibold tracking-wide text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full text-[11px] border border-amber-500/30">
            {t('verificationRequest')}
          </span>

          <div className="flex items-center gap-2 min-w-0 flex-wrap text-slate-300">
            <span className="truncate">{t('verificationNotice')}</span>
            {isExpired ? (
              <span className="font-bold text-rose-300 bg-rose-950/60 px-2.5 py-0.5 rounded-md border border-rose-800/50">
                {t('expiredNotice')}
              </span>
            ) : timeLeft ? (
              <span className="font-mono font-bold text-amber-400 bg-slate-800/90 px-2.5 py-0.5 rounded-md border border-slate-700/80 shadow-inner tracking-wide">
                {timeLeft.days > 0 && `${timeLeft.days}d `}
                {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            ) : null}
          </div>
        </div>

        <button
          onClick={() => onOpenVerification?.()}
          type="button"
          className="shrink-0 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium text-xs px-3.5 py-1.5 rounded-full transition-all duration-200 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <StudyHubIcon name="file" size={14} />
          <span>{t('uploadStudentCardNow')}</span>
        </button>
      </div>
    </aside>
  )
}
