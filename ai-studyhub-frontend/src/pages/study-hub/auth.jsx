import { useState } from 'react'
import Brand from '../../components/layout/Brand'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { login, register } from '../../features/auth/authService'

export function LoginPage({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await login({ email: email.trim(), password }, remember)
      onLogin(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng trở lại!" onNavigate={onNavigate}>
      <AuthCard onSubmit={handleSubmit}>
        <Field icon="mail" label="Email" value={email} onChange={setEmail} type="email" />
        <Field icon="lock" label="Mật khẩu" value={password} onChange={setPassword} type="password" />
        <div className="auth-row">
          <label>
            <input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />
            {' '}Ghi nhớ đăng nhập
          </label>
        </div>
        {error && <p className="api-status api-status--error">{error}</p>}
        <button className="auth-submit" disabled={loading} type="submit">
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
        <p>Chưa có tài khoản? <button onClick={() => onNavigate('register')} type="button">Đăng ký ngay</button></p>
      </AuthCard>
    </AuthShell>
  )
}

export function RegisterPage({ onNavigate, onRegister }) {
  const [form, setForm] = useState({
    studentCode: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const session = await register({
        studentCode: form.studentCode.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      onRegister(session)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Đăng ký tài khoản" subtitle="Xác minh sinh viên để tham gia cộng đồng" onNavigate={onNavigate}>
      <AuthCard onSubmit={handleSubmit}>
        <Field icon="user" label="Mã sinh viên" value={form.studentCode} onChange={(value) => setField('studentCode', value)} />
        <Field icon="user" label="Họ và tên" value={form.fullName} onChange={(value) => setField('fullName', value)} />
        <Field icon="mail" label="Email" value={form.email} onChange={(value) => setField('email', value)} type="email" />
        <Field icon="lock" label="Mật khẩu" value={form.password} onChange={(value) => setField('password', value)} type="password" />
        <Field icon="lock" label="Xác nhận mật khẩu" value={form.confirmPassword} onChange={(value) => setField('confirmPassword', value)} type="password" />
        {error && <p className="api-status api-status--error">{error}</p>}
        <button className="auth-submit" disabled={loading} type="submit">
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
        <p>Đã có tài khoản? <button onClick={() => onNavigate('login')} type="button">Đăng nhập</button></p>
      </AuthCard>
    </AuthShell>
  )
}

function AuthShell({ children, onNavigate, subtitle, title }) {
  return (
    <main className="auth-page">
      <Brand compact />
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
      <button className="auth-back" onClick={() => onNavigate('guest-home')} type="button">← Quay về trang chủ</button>
    </main>
  )
}

function AuthCard({ children, onSubmit }) {
  return <form className="auth-card" onSubmit={onSubmit}>{children}</form>
}

function Field({ icon, label, onChange, type = 'text', value }) {
  return (
    <label className="field">
      {label}
      <span>
        <StudyHubIcon name={icon} size={18} />
        <input
          onChange={(event) => onChange(event.target.value)}
          required
          type={type}
          value={value}
        />
      </span>
    </label>
  )
}
