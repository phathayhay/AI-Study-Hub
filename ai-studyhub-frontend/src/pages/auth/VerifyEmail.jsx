import { useState, useEffect, useRef } from 'react'
import { MailOpen, Loader2, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { verifyEmail, sendVerifyEmail } from '../../features/auth/authService'
import Brand from '../../components/layout/Brand'

export function VerifyEmailView({ email, onBack, onError, onSuccess }) {
  const [timer, setTimer] = useState(60)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    let interval = null
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timer])

  const handleResend = async () => {
    if (timer > 0 || resending) return
    setResending(true)
    onError('')
    onSuccess('')
    try {
      await sendVerifyEmail(email)
      onSuccess(`A fresh verification link has been sent to ${email}`)
      setTimer(60)
    } catch (err) {
      onError(err.message || 'Failed to resend verification link.')
    } finally {
      onResendingState(false)
    }
  }

  // Wrapper function to clean state safely
  const onResendingState = (state) => {
    setResending(state)
  }

  return (
    <div className="flex flex-col text-center py-4">
      <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-inner relative">
        <div className="absolute inset-0 rounded-2xl bg-indigo-400/10 dark:bg-indigo-400/5 animate-ping duration-1500" />
        <MailOpen className="w-8 h-8 relative z-10" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Check your inbox
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto mb-8">
        We've dispatched a secure verification link to:<br />
        <strong className="text-slate-800 dark:text-slate-200 break-all">{email || 'your email'}</strong>.<br />
        Please click the link to activate your student workspace.
      </p>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={timer > 0 || resending}
          className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:bg-slate-50/50 dark:disabled:bg-slate-950/20 py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Resending link...</span>
            </>
          ) : timer > 0 ? (
            <span>Resend Link in {timer}s</span>
          ) : (
            <span>Resend Link</span>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer"
        >
          Back to Sign In
        </button>
      </div>
    </div>
  )
}

export function VerifyEmailPage({ onNavigate, onSignIn }) {
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'
  const [message, setMessage] = useState('')
  const effectRan = useRef(false)

  useEffect(() => {
    if (effectRan.current) return
    effectRan.current = true

    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Mã xác thực không hợp lệ hoặc đã hết hạn.')
      return
    }

    verifyEmail(token)
      .then((res) => {
        setStatus('success')
        setMessage(res?.message || 'Xác nhận email tài khoản thành công!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'Xác nhận email thất bại. Vui lòng kiểm tra lại liên kết.')
      })
  }, [])

  return (
    <main className="h-screen overflow-hidden bg-slate-50 dark:bg-[#0f172a] flex flex-col lg:flex-row font-sans transition-colors duration-300">
      <style>{`
        @keyframes authFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-auth-fade-in {
          animation: authFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Hero Section (Left Column) */}
      <section className="relative hidden lg:flex w-full lg:w-[42%] bg-[#0a0f1d] flex-col justify-between p-8 lg:p-10 text-white lg:h-full overflow-y-auto border-r border-slate-800/50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10">
          <Brand compact={false} />
        </div>
        <div className="relative z-10 my-auto py-8 flex flex-col gap-6 max-w-lg">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 tracking-wide w-fit">
            Learn smarter every day
          </span>
          <h2 className="text-3xl lg:text-4xl font-jakarta font-extrabold leading-tight text-white">
            Verify your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-white">
              account activation.
            </span>
          </h2>
          <p className="text-slate-400 text-sm">
            You're just one step away from joining your personal study space powered by advanced AI.
          </p>
        </div>
        <div className="relative z-10 border-t border-slate-800/40 pt-4 hidden lg:block">
          <p className="text-xs text-slate-500 italic">
            "Every study session can become clearer, faster, and more engaging."
          </p>
        </div>
      </section>

      {/* Form / Interactive Section (Right Column) */}
      <section className="w-full lg:w-[58%] flex flex-col justify-center overflow-y-auto h-full py-6 px-6 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto animate-auth-fade-in text-center">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying account...</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Please wait a moment while we verify your email.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification successful!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message || 'Your account has been successfully verified.'}
              </p>
              <button
                onClick={() => onSignIn ? onSignIn() : onNavigate('login')}
                className="w-full mt-4 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                Sign In Now →
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification failed</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message || 'The verification link is invalid or expired.'}
              </p>
              <button
                onClick={() => onNavigate('explore')}
                className="w-full mt-4 flex items-center justify-center bg-slate-950 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          )}

          <div className="mt-8 border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center">
            <button 
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
          </div>

        </div>
      </section>
    </main>
  )
}
