import { useEffect, useRef, useState } from 'react'
import Brand from '../../components/layout/Brand'
import StudyHubIcon from '../../components/icons/StudyHubIcons'
import { login, register, verifyEmail, forgotPassword, resetPassword } from '../../features/auth/authService'

export function LoginPage({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const transition = useAuthTransition(onNavigate)

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [forgotError, setForgotError] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

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

  const handleForgotSubmit = async (event) => {
    event.preventDefault()
    setForgotLoading(true)
    setForgotError('')
    setForgotSuccess('')
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotSuccess('Đã gửi liên kết đặt lại mật khẩu! Vui lòng kiểm tra email của bạn.')
      setForgotEmail('')
    } catch (err) {
      setForgotError(err.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại email.')
    } finally {
      setForgotLoading(false)
    }
  }

  if (forgotMode) {
    return (
      <AuthShell
        description="Nhập email của bạn để nhận liên kết khôi phục mật khẩu tài khoản."
        leaving={transition.leaving}
        onBack={() => setForgotMode(false)}
        subtitle="Khôi phục tài khoản của bạn"
        title="Quên mật khẩu"
      >
        <AuthCard onSubmit={handleForgotSubmit}>
          <Field
            autoComplete="email"
            icon="mail"
            label="Email đăng ký"
            onChange={setForgotEmail}
            placeholder="name@fpt.edu.vn"
            type="email"
            value={forgotEmail}
          />
          {forgotError && (
            <p className="auth-error" role="alert">
              <StudyHubIcon name="help" size={16} /> {forgotError}
            </p>
          )}
          {forgotSuccess && (
            <p style={{ color: '#15803d', backgroundColor: '#dcfce7', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', margin: '8px 0' }}>
              ✓ {forgotSuccess}
            </p>
          )}
          <button className="auth-submit" disabled={forgotLoading} type="submit">
            {forgotLoading ? (
              <>
                <span className="auth-spinner" /> Đang gửi yêu cầu...
              </>
            ) : (
              <>
                Gửi liên kết khôi phục <span aria-hidden="true">→</span>
              </>
            )}
          </button>
          <p className="auth-switch">
            Nhớ mật khẩu?
            <button onClick={() => setForgotMode(false)} type="button">
              Đăng nhập ngay
            </button>
          </p>
        </AuthCard>
      </AuthShell>
    )
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
        <div className="auth-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '13px' }}>
          <label className="auth-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              id="remember"
              name="remember"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <button 
            onClick={() => setForgotMode(true)} 
            type="button" 
            style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontWeight: 600, fontSize: '13.5px' }}
          >
            Quên mật khẩu?
          </button>
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
    firstName: '',
    lastName: '',
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
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
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
            autoComplete="family-name"
            icon="user"
            label="Họ và tên đệm"
            onChange={(value) => setField('lastName', value)}
            placeholder="Nguyễn Văn"
            value={form.lastName}
          />
          <Field
            autoComplete="given-name"
            icon="user"
            label="Tên"
            onChange={(value) => setField('firstName', value)}
            placeholder="A"
            value={form.firstName}
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

export function VerifyEmailPage({ onNavigate }) {
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

  const transition = useAuthTransition(onNavigate)

  return (
    <AuthShell
      description="Cảm ơn bạn đã lựa chọn AI Study Hub FPT. Hãy kích hoạt tài khoản để tiếp tục."
      leaving={transition.leaving}
      onBack={() => transition.to('explore')}
      subtitle="Xác thực tài khoản của bạn"
      title="Xác nhận Email"
    >
      <div className="auth-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <span className="auth-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
            <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '15px' }}>
              Đang xác thực tài khoản của bạn, vui lòng đợi trong giây lát...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: '#15803d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              ✓
            </div>
            <h3 style={{ color: 'var(--text-primary, #0f172a)', fontSize: '18px', fontWeight: 600 }}>
              Xác thực thành công!
            </h3>
            <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '14px', lineHeight: 1.5 }}>
              {message}
            </p>
            <button
              className="auth-submit"
              onClick={() => transition.to('login')}
              type="button"
              style={{ marginTop: '10px', width: '100%' }}
            >
              Đăng nhập ngay <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              ×
            </div>
            <h3 style={{ color: 'var(--text-primary, #0f172a)', fontSize: '18px', fontWeight: 600 }}>
              Xác thực thất bại
            </h3>
            <p style={{ color: '#b91c1c', fontSize: '14px', lineHeight: 1.5 }}>
              {message}
            </p>
            <button
              className="auth-submit"
              onClick={() => transition.to('explore')}
              type="button"
              style={{ marginTop: '10px', width: '100%', backgroundColor: 'var(--text-secondary, #475569)' }}
            >
              Quay lại Trang chủ
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}

export function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('input') // 'input', 'loading', 'success', 'error'
  const [message, setMessage] = useState('')
  const transition = useAuthTransition(onNavigate)
  
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setStatus('input')
      setMessage('Mật khẩu xác nhận không khớp.')
      return
    }
    
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Mã khôi phục không hợp lệ hoặc đã hết hạn.')
      return
    }
    
    setStatus('loading')
    try {
      await resetPassword({ token, newPassword: password })
      setStatus('success')
      setMessage('Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.')
    } catch (err) {
      setStatus('input')
      setMessage(err.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại liên kết.')
    }
  }
  
  return (
    <AuthShell
      description="Nhập mật khẩu mới cho tài khoản AI Study Hub FPT của bạn."
      leaving={transition.leaving}
      onBack={() => transition.to('explore')}
      subtitle="Đặt lại mật khẩu mới"
      title="Khôi phục mật khẩu"
    >
      {status === 'success' ? (
        <div className="auth-card" style={{ textAlign: 'center', padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#dcfce7',
            color: '#15803d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            ✓
          </div>
          <p style={{ color: 'var(--text-secondary, #475569)', fontSize: '14px', lineHeight: 1.5 }}>
            {message}
          </p>
          <button
            className="auth-submit"
            onClick={() => transition.to('login')}
            type="button"
            style={{ width: '100%' }}
          >
            Đăng nhập ngay <span aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <AuthCard onSubmit={handleSubmit}>
          <Field
            autoComplete="new-password"
            icon="lock"
            label="Mật khẩu mới"
            onChange={setPassword}
            placeholder="Nhập mật khẩu mới"
            revealable
            type="password"
            value={password}
          />
          <Field
            autoComplete="new-password"
            icon="lock"
            label="Xác nhận mật khẩu mới"
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            revealable
            type="password"
            value={confirmPassword}
          />
          {message && (
            <p className="auth-error" role="alert">
              <StudyHubIcon name="help" size={16} /> {message}
            </p>
          )}
          <button className="auth-submit" disabled={status === 'loading'} type="submit">
            {status === 'loading' ? (
              <>
                <span className="auth-spinner" /> Đang cập nhật mật khẩu...
              </>
            ) : (
              <>
                Đặt lại mật khẩu <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </AuthCard>
      )}
    </AuthShell>
  )
}