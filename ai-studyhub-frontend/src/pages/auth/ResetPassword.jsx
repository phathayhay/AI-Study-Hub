import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { resetPassword as submitPasswordReset } from '../../features/auth/authService'
import { AuthLayout, InputField } from './AuthLayout'

export function ResetPasswordPage({ onNavigate }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <AuthLayout
      modeTitle="Reset Password"
      modeSubtitle="Create a new password to regain access to your study workspace."
      error={error}
      success={success}
      onNavigate={onNavigate}
    >
      <ResetPasswordForm
        onLoading={setLoading}
        onError={setError}
        onSuccess={setSuccess}
        onNavigate={onNavigate}
        loading={loading}
      />
    </AuthLayout>
  )
}

function ResetPasswordForm({ onLoading, onError, onSuccess, onNavigate, loading }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    onError('')
    onSuccess('')

    if (!token) {
      onError('This reset link is invalid or has expired.')
      return
    }

    if (password.length < 6) {
      onError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      onError('Passwords do not match.')
      return
    }

    onLoading(true)
    try {
      await submitPasswordReset({ token, newPassword: password })
      onSuccess('Your password has been reset successfully. Redirecting to sign in...')
      setPassword('')
      setConfirmPassword('')
      window.setTimeout(() => onNavigate('login'), 1200)
    } catch (err) {
      onError(err.message || 'Reset password failed. Please request a new link.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <InputField
        label="New Password"
        icon={Lock}
        type="password"
        placeholder="Enter a new password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        revealable
        minLength={6}
      />

      <InputField
        label="Confirm Password"
        icon={Lock}
        type="password"
        placeholder="Re-enter your new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        revealable
        minLength={6}
      />

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/60 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating password...</span>
          </>
        ) : (
          <span>Reset Password</span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onNavigate('login')}
        className="w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 py-3 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer"
      >
        Back to Sign In
      </button>
    </form>
  )
}
