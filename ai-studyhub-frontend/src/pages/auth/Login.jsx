import { useState, useEffect } from 'react'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { login as apiLogin } from '../../services/authService'
import { AuthLayout, InputField } from './AuthLayout'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REMEMBERED_EMAIL_KEY = 'rememberedEmail'

function getEmailError(value) {
  const normalized = value.trim()
  if (!normalized) return 'Please enter your email address.'
  if (!EMAIL_REGEX.test(normalized)) return 'Please enter a valid email address.'
  return ''
}

export function LoginPage({ onLogin, onNavigate }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <AuthLayout
      modeTitle="Sign In"
      modeSubtitle="Welcome back! Access your smart study workspace."
      error={error}
      onNavigate={onNavigate}
    >
      <SignInForm
        onLogin={onLogin}
        onLoading={setLoading}
        onError={setError}
        onNavigate={onNavigate}
        loading={loading}
      />
    </AuthLayout>
  )
}

function SignInForm({ onLogin, onLoading, onError, onNavigate, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || ''
    if (rememberedEmail) {
      setEmail(rememberedEmail)
      setRemember(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    const emailError = getEmailError(email)
    if (emailError) nextErrors.email = emailError
    if (!password) nextErrors.password = 'Please enter your password.'
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      onError('')
      return
    }
    onLoading(true)
    onError('')
    try {
      const response = await apiLogin({ email: email.trim(), password })
      if (remember) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim())
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY)
      }
      onLogin(response, remember)
    } catch (err) {
      onError(err.message || 'Incorrect email or password.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <InputField 
        label="Email"
        icon={Mail}
        type="text"
        inputMode="email"
        placeholder="name@fpt.edu.vn"
        value={email}
        onChange={(value) => {
          setEmail(value)
          if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }))
        }}
        autoComplete="email"
        error={fieldErrors.email}
      />

      <InputField 
        label="Password"
        icon={Lock}
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(value) => {
          setPassword(value)
          if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }))
        }}
        autoComplete="current-password"
        revealable
        error={fieldErrors.password}
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
          onClick={() => onNavigate?.('forgot-password')}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
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

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate?.('register')}
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Sign up now
        </button>
      </p>
    </form>
  )
}
