import { useEffect, useRef, useState } from 'react'
import Brand from '../../components/layout/Brand'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { login, register } from '../../features/auth/authService'

export function LoginPage({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const transition = useAuthTransition(onNavigate)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      onLogin(await login({ email: email.trim(), password }, remember))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      description="Tiếp tục hành trình học tập của bạn với tài liệu, flashcard và trợ lý AI."
      leaving={transition.leaving}
      onBack={() => transition.to('explore')}
      subtitle="Chào mừng trở lại!"
      title="Đăng nhập"
    >
      <AuthCard onSubmit={handleSubmit}>
        <Field
          autoComplete="email"
          icon="mail"
          label="Email"
          onChange={setEmail}
          placeholder="name@fpt.edu.vn"
          type="email"
          value={email}
        />
        <Field
          autoComplete="current-password"
          icon="lock"
          label="Mật khẩu"
          onChange={setPassword}
          placeholder="Nhập mật khẩu"
          revealable
          type="password"
          value={password}
        />
        <div className="auth-row">
          <label className="auth-checkbox">
            <input
              id="remember"
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
        </div>
        {error && (
          <p className="auth-error" role="alert">
            <StudyHubIcon name="help" size={16} /> {error}
          </p>
        )}
        <button className="auth-submit" disabled={loading} type="submit">
          {loading ? (
            <>
              <span className="auth-spinner" /> Đang đăng nhập...
            </>
          ) : (
            <>
              Đăng nhập <span aria-hidden="true">→</span>
            </>
          )}
        </button>
        <p className="auth-switch">
          Chưa có tài khoản?
          <button onClick={() => transition.to('register')} type="button">
            Đăng ký ngay
          </button>
        </p>
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
  const transition = useAuthTransition(onNavigate)

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
    <AuthShell
      compact
      description="Tạo không gian học tập cá nhân và bắt đầu khai thác sức mạnh của AI."
      leaving={transition.leaving}
      onBack={() => transition.to('explore')}
      subtitle="Bắt đầu hành trình học tập thông minh"
      title="Tạo tài khoản"
    >
      <AuthCard compact onSubmit={handleSubmit}>
        <div className="auth-form-grid">
          <Field
            autoComplete="name"
            icon="user"
            label="Họ và tên"
            onChange={(value) => setField('fullName', value)}
            placeholder="Nguyễn Văn A"
            value={form.fullName}
          />
          <Field
            autoComplete="username"
            icon="card"
            label="Mã sinh viên"
            onChange={(value) => setField('studentCode', value)}
            placeholder="SE123456"
            value={form.studentCode}
          />
        </div>
        <Field
          autoComplete="email"
          icon="mail"
          label="Email"
          onChange={(value) => setField('email', value)}
          placeholder="name@fpt.edu.vn"
          type="email"
          value={form.email}
        />
        <div className="auth-form-grid">
          <Field
            autoComplete="new-password"
            icon="lock"
            label="Mật khẩu"
            onChange={(value) => setField('password', value)}
            placeholder="Tối thiểu 8 ký tự"
            revealable
            type="password"
            value={form.password}
          />
          <Field
            autoComplete="new-password"
            icon="lock"
            label="Xác nhận mật khẩu"
            onChange={(value) => setField('confirmPassword', value)}
            placeholder="Nhập lại mật khẩu"
            revealable
            type="password"
            value={form.confirmPassword}
          />
        </div>
        {error && (
          <p className="auth-error" role="alert">
            <StudyHubIcon name="help" size={16} /> {error}
          </p>
        )}
        <button className="auth-submit" disabled={loading} type="submit">
          {loading ? (
            <>
              <span className="auth-spinner" /> Đang đăng ký...
            </>
          ) : (
            <>
              Tạo tài khoản <span aria-hidden="true">→</span>
            </>
          )}
        </button>
        <p className="auth-switch">
          Đã có tài khoản?
          <button onClick={() => transition.to('login')} type="button">
            Đăng nhập
          </button>
        </p>
      </AuthCard>
    </AuthShell>
  )
}

function AuthShell({ children, compact = false, description, leaving, onBack, subtitle, title }) {
  return (
    <main className={`auth-page ${compact ? 'auth-page--compact' : ''} ${leaving ? 'is-leaving' : ''}`}>
      <div className="auth-orb auth-orb--one" />
      <div className="auth-orb auth-orb--two" />

      <section className="auth-showcase" aria-hidden="true">
        <div className="auth-showcase__brand">
          <Brand compact />
        </div>
        <div className="auth-showcase__content">
          <span className="auth-eyebrow">
            <StudyHubIcon name="sparkle" size={16} /> Học thông minh hơn mỗi ngày
          </span>
          <h2>
            Biến tài liệu thành<br />
            <strong>kiến thức của bạn.</strong>
          </h2>
          <p>{description}</p>
          <div className="auth-feature-list">
            <span>
              <StudyHubIcon name="message" size={18} /> Trò chuyện với tài liệu bằng AI
            </span>
            <span>
              <StudyHubIcon name="card" size={18} /> Tạo flashcard và quiz tức thì
            </span>
            <span>
              <StudyHubIcon name="folder" size={18} /> Quản lý học liệu tập trung
            </span>
          </div>
        </div>
        <div className="auth-showcase__quote">
          <span>"</span>
          <p>Mỗi phiên học đều có thể trở nên rõ ràng và thú vị hơn.</p>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <div className="auth-mobile-brand">
            <Brand compact />
          </div>
          <header className="auth-heading">
            <span className="auth-heading__icon">
              <StudyHubIcon name="book" size={22} />
            </span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
          <button className="auth-back" onClick={onBack} type="button">
            <StudyHubIcon name="arrow-left" size={16} /> Quay về trang chủ
          </button>
        </div>
      </section>
    </main>
  )
}

function AuthCard({ children, compact = false, onSubmit }) {
  return (
    <form className={`auth-card ${compact ? 'auth-card--compact' : ''}`} onSubmit={onSubmit}>
      {children}
    </form>
  )
}

function Field({
  autoComplete,
  icon,
  label,
  onChange,
  placeholder,
  revealable = false,
  type = 'text',
  value,
}) {
  const [visible, setVisible] = useState(false)
  const inputType = revealable && visible ? 'text' : type

  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        <StudyHubIcon name={icon} size={18} />
        <input
          id={autoComplete}
          name={autoComplete}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          type={inputType}
          value={value}
        />
        {revealable && (
          <button
            aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="field__reveal"
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            <StudyHubIcon name="eye" size={18} />
          </button>
        )}
      </span>
    </label>
  )
}

function useAuthTransition(onNavigate) {
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const to = (route) => {
    if (leaving) return
    setLeaving(true)
    timerRef.current = window.setTimeout(() => onNavigate(route), 240)
  }

  return { leaving, to }
}