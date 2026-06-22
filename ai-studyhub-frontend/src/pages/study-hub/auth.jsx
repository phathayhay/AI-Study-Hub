import { useEffect, useRef, useState } from 'react'
import { 
  Mail, Lock, User, ArrowLeft, MailOpen, Loader2, Sparkles, 
  MessageSquare, CheckSquare, FileText, AlertCircle, Eye, EyeOff, ClipboardList, Check, Layers
} from 'lucide-react'
import Brand from '../../components/layout/Brand'
import { login as apiLogin, register as apiRegister, sendVerifyEmail } from '../../features/auth/authService'

export function LoginPage({ onLogin, onNavigate }) {
  return (
    <AuthLayout 
      initialMode="signin" 
      onLogin={onLogin} 
      onNavigate={onNavigate} 
    />
  )
}

export function RegisterPage({ onNavigate, onRegister }) {
  return (
    <AuthLayout 
      initialMode="signup" 
      onNavigate={onNavigate} 
      onRegister={onRegister}
    />
  )
}

export function AuthLayout({ initialMode = 'signin', onLogin, onNavigate }) {
  const [mode, setMode] = useState(initialMode) // 'signin', 'signup', 'verify-email'
  const [emailUser, setEmailUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleToggleMode = (newMode) => {
    setError('')
    setSuccess('')
    setMode(newMode)
    if (onNavigate) {
      onNavigate(newMode === 'signup' ? 'register' : 'login')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0f172a] flex flex-col lg:flex-row font-sans transition-colors duration-300">
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
      <section className="relative overflow-hidden w-full lg:w-[42%] bg-[#0a0f1d] flex flex-col justify-between p-8 lg:p-12 text-white min-h-[400px] lg:min-h-screen border-b lg:border-b-0 lg:border-r border-slate-800/50">
        {/* Glow Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] animate-pulse duration-[6000ms]" />
          <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px]" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <Brand compact={false} />
        </div>

        {/* Main Marketing / Showcase Content */}
        <div className="relative z-10 my-auto py-8 lg:py-0 flex flex-col gap-6 max-w-lg">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 tracking-wide w-fit">
            <Sparkles className="w-3.5 h-3.5" /> Learn smarter every day
          </span>

          <h2 className="text-3xl lg:text-4xl font-jakarta font-extrabold leading-tight text-white select-none">
            Turn documents into<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-white">
              your knowledge.
            </span>
          </h2>
          
          <p className="text-slate-400 text-sm lg:text-base leading-relaxed">
            Create a personal study space powered by advanced AI. Chat with documents, auto-generate quizzes, and review using smart flashcards.
          </p>

          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Interactive AI Tutor</h4>
                <p className="text-xs text-slate-400 mt-0.5">Ask questions and get instant summaries from any paper or presentation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Automatic Study Materials</h4>
                <p className="text-xs text-slate-400 mt-0.5">Generate high-quality multiple choice questions and review decks with one click.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-200">Smart Storage Hub</h4>
                <p className="text-xs text-slate-400 mt-0.5">Keep all your slides, notes, and references organized in custom folders.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="relative z-10 border-t border-slate-800/40 pt-4 hidden lg:block">
          <p className="text-xs text-slate-500 italic">
            "Every study session can become clearer, faster, and more engaging."
          </p>
        </div>
      </section>

      {/* Form / Interactive Section (Right Column) */}
      <section className="w-full lg:w-[58%] flex flex-col justify-center py-12 px-6 lg:px-16 xl:px-24">
        <div className="w-full max-w-md mx-auto animate-auth-fade-in">
          
          {/* Header section (switches based on mode) */}
          <div className="mb-8">
            {mode === 'signin' && (
              <>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sign In</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Welcome back! Access your smart study workspace.</p>
              </>
            )}
            {mode === 'signup' && (
              <>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Start your smart learning journey today.</p>
              </>
            )}
            {mode === 'verify-email' && (
              <>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Check your inbox</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Verify your email to complete registration.</p>
              </>
            )}
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 dark:text-red-400 text-sm flex gap-3 items-start animate-[shake_0.4s_ease-in-out]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm flex gap-3 items-start">
              <Check className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Forms switcher */}
          {mode === 'signin' && (
            <SignInForm 
              onLogin={onLogin}
              onLoading={setLoading}
              onError={setError}
              onToggleMode={handleToggleMode}
              loading={loading}
            />
          )}

          {mode === 'signup' && (
            <SignUpForm 
              onRegisterSuccess={(email) => {
                setEmailUser(email)
                setMode('verify-email')
              }}
              onLoading={setLoading}
              onError={setError}
              onToggleMode={handleToggleMode}
              loading={loading}
            />
          )}

          {mode === 'verify-email' && (
            <VerifyEmailView 
              email={emailUser}
              onBack={() => handleToggleMode('signin')}
              onError={setError}
              onSuccess={setSuccess}
            />
          )}

          {/* Back Home link */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800/60 pt-6 text-center">
            <button 
              onClick={() => onNavigate?.('explore')}
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

/* INPUT FIELD SUB-COMPONENT */
function InputField({
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  required = true,
  revealable = false
}) {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = revealable && showPassword ? 'text' : type

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon className="w-4.5 h-4.5" />
          </span>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          className={`w-full ${Icon ? 'pl-11' : 'px-4'} ${revealable ? 'pr-11' : 'px-4'} py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none transition-all duration-200`}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

/* SOCIAL LOGIN (GOOGLE) */
function SocialLogin() {
  const handleGoogleClick = () => {
    window.showToast?.('Google authentication is integrated in production mode.', 'info')
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800/80"></div>
        </div>
        <span className="relative px-3 bg-white dark:bg-[#0f172a] text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
          or check in with
        </span>
      </div>

      <button
        type="button"
        onClick={handleGoogleClick}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 shadow-sm"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
        <span>Continue with Google</span>
      </button>
    </div>
  )
}

/* SIGN IN FORM SUB-COMPONENT */
function SignInForm({ onLogin, onLoading, onError, onToggleMode, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    onLoading(true)
    onError('')
    try {
      const response = await apiLogin({ email: email.trim(), password })
      onLogin(response, remember)
    } catch (err) {
      onError(err.message || 'Incorrect email or password.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <InputField 
        label="Email"
        icon={Mail}
        type="email"
        placeholder="name@fpt.edu.vn"
        value={email}
        onChange={setEmail}
        autoComplete="email"
      />

      <InputField 
        label="Password"
        icon={Lock}
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        revealable
      />

      <div className="flex items-center justify-between mt-1">
        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input 
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500/20"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Remember me</span>
        </label>
        
        <button 
          type="button" 
          onClick={() => window.showToast?.('Please contact support to reset your password.', 'info')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Signing In...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </button>

      <SocialLogin />

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => onToggleMode('signup')}
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign up now
        </button>
      </p>
    </form>
  )
}

/* SIGN UP FORM SUB-COMPONENT */
function SignUpForm({ onRegisterSuccess, onLoading, onError, onToggleMode, loading }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  const updateField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      onError('Password must be at least 8 characters long.')
      return
    }
    if (form.password !== form.confirmPassword) {
      onError('Passwords do not match.')
      return
    }

    onLoading(true)
    onError('')
    try {
      await apiRegister({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password
      })
      onRegisterSuccess(form.email.trim())
    } catch (err) {
      onError(err.message || 'Email already exists or invalid data.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField 
          label="First Name"
          icon={User}
          placeholder="John"
          value={form.firstName}
          onChange={(val) => updateField('firstName', val)}
          autoComplete="given-name"
        />
        <InputField 
          label="Last Name"
          icon={User}
          placeholder="Doe"
          value={form.lastName}
          onChange={(val) => updateField('lastName', val)}
          autoComplete="family-name"
        />
      </div>

      <InputField 
        label="Email Address"
        icon={Mail}
        type="email"
        placeholder="name@fpt.edu.vn"
        value={form.email}
        onChange={(val) => updateField('email', val)}
        autoComplete="email"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField 
          label="Password"
          icon={Lock}
          type="password"
          placeholder="Min 8 chars"
          value={form.password}
          onChange={(val) => updateField('password', val)}
          autoComplete="new-password"
          revealable
        />
        <InputField 
          label="Confirm"
          icon={Lock}
          type="password"
          placeholder="Re-enter password"
          value={form.confirmPassword}
          onChange={(val) => updateField('confirmPassword', val)}
          autoComplete="new-password"
          revealable
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed mt-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </button>

      <SocialLogin />

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onToggleMode('signin')}
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Sign In
        </button>
      </p>
    </form>
  )
}

/* EMAIL VERIFICATION SUB-COMPONENT */
function VerifyEmailView({ email, onBack, onError, onSuccess }) {
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
      setResending(false)
    }
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