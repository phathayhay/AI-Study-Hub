import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { forgotPassword as requestPasswordReset } from '../../features/auth/authService'
import { AuthLayout, InputField } from './AuthLayout'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getEmailError(value) {
  const normalized = value.trim()
  if (!normalized) return 'Please enter your email address.'
  if (!EMAIL_REGEX.test(normalized)) return 'Please enter a valid email address.'
  return ''
}

export function ForgotPasswordPage({ onNavigate }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <AuthLayout
      modeTitle="Forgot Password"
      modeSubtitle="Enter your email and we will send you a secure reset link."
      error={error}
      success={success}
      onNavigate={onNavigate}
    >
      <ForgotPasswordForm
        onLoading={setLoading}
        onError={setError}
        onSuccess={setSuccess}
        onNavigate={onNavigate}
        loading={loading}
      />
    </AuthLayout>
  )
}

function ForgotPasswordForm({ onLoading, onError, onSuccess, onNavigate, loading }) {
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailError = getEmailError(email)
    if (emailError) {
      setFieldErrors({ email: emailError })
      onError('')
      onSuccess('')
      return
    }
    setFieldErrors({})
    onLoading(true)
    onError('')
    onSuccess('')

    try {
      const normalizedEmail = email.trim().toLowerCase()
      await requestPasswordReset(normalizedEmail)
      onSuccess(`A password reset link has been sent to ${normalizedEmail}. Please check your inbox.`)
    } catch (err) {
      onError(err.message || 'Unable to send the reset link right now.')
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
          if (fieldErrors.email) setFieldErrors({ email: '' })
        }}
        autoComplete="email"
        error={fieldErrors.email}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending reset link...</span>
          </>
        ) : (
          <span>Send Reset Link</span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onNavigate?.('login')}
        className="w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer"
      >
        Back to Sign In
      </button>
    </form>
  )
}
