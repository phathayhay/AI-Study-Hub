import { useState } from 'react'
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react'
import { register as apiRegister } from '../../services/authService'
import { AuthLayout, InputField } from './AuthLayout'
import { VerifyEmailView } from './VerifyEmail'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getEmailError(value) {
  const normalized = value.trim()
  if (!normalized) return 'Please enter your email address.'
  if (!EMAIL_REGEX.test(normalized)) return 'Please enter a valid email address.'
  return ''
}

export function RegisterPage({ onNavigate }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  if (registeredEmail) {
    return (
      <AuthLayout
        modeTitle="Verify your email"
        modeSubtitle="One last step before entering your study workspace."
        error={error}
        onNavigate={onNavigate}
      >
        <VerifyEmailView
          email={registeredEmail}
          onBack={() => onNavigate('login')}
          onError={setError}
          onSuccess={(message) => window.showToast?.(message, 'success')}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      modeTitle="Create Account"
      modeSubtitle="Start your smart learning journey today."
      error={error}
      onNavigate={onNavigate}
    >
      <SignUpForm
        onRegisterSuccess={setRegisteredEmail}
        onLoading={setLoading}
        onError={setError}
        onNavigate={onNavigate}
        loading={loading}
      />
    </AuthLayout>
  )
}

function SignUpForm({ onRegisterSuccess, onLoading, onError, onNavigate, loading }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const updateField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setFieldErrors(prev => ({ ...prev, [key]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!form.firstName.trim()) nextErrors.firstName = 'Please enter your first name.'
    if (!form.lastName.trim()) nextErrors.lastName = 'Please enter your last name.'
    const emailError = getEmailError(form.email)
    if (emailError) nextErrors.email = emailError
    if (form.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters long.'
    }
    if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.'
    }
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      onError('')
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
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField 
          label="First Name"
          icon={UserIcon}
          placeholder="John"
          value={form.firstName}
          onChange={(val) => updateField('firstName', val)}
          autoComplete="given-name"
          maxLength={50}
          error={fieldErrors.firstName}
        />
        <InputField 
          label="Last Name"
          icon={UserIcon}
          placeholder="Doe"
          value={form.lastName}
          onChange={(val) => updateField('lastName', val)}
          autoComplete="family-name"
          maxLength={50}
          error={fieldErrors.lastName}
        />
      </div>

      <InputField 
        label="Email Address"
        icon={Mail}
        type="text"
        inputMode="email"
        placeholder="name@fpt.edu.vn"
        value={form.email}
        onChange={(val) => updateField('email', val)}
        autoComplete="email"
        maxLength={150}
        error={fieldErrors.email}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField 
          label="Password"
          icon={Lock}
          type="password"
          placeholder="Min 6 chars"
          value={form.password}
          onChange={(val) => updateField('password', val)}
          autoComplete="new-password"
          revealable
          minLength={6}
          error={fieldErrors.password}
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
          error={fieldErrors.confirmPassword}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed mt-2"
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

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate?.('login')}
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
        >
          Sign In
        </button>
      </p>
    </form>
  )
}
