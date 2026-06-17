import { useState } from 'react'
import Brand from '../../components/layout/Brand'
import * as authService from '../../features/auth/authService'

export function LoginPage({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Vui lòng nhập email và mật khẩu'); return }
    setBusy(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng trở lại!" onNavigate={onNavigate}>
      <form className="auth-card" onSubmit={submit}>
        <label className="field">
          Email FPT
          <span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@fpt.edu.vn" required /></span>
        </label>
        <label className="field">
          Mật khẩu
          <span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></span>
        </label>
        {error && <p className="auth-error">{error}</p>}
        <div className="auth-row"><label><input type="checkbox" /> Ghi nhớ đăng nhập</label><button onClick={() => onNavigate('forgot-password')} type="button" className="link-btn">Quên mật khẩu?</button></div>
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Đăng nhập'}</button>
        <p>Chưa có tài khoản?<button onClick={() => onNavigate('register')} type="button">Đăng ký ngay</button></p>
        <hr />
        <small><strong>Demo:</strong> admin@fpt.edu.vn / admin123 – student@fpt.edu.vn / student123</small>
      </form>
    </AuthShell>
  )
}

export function RegisterPage({ onRegister, onNavigate }) {
  const [form, setForm] = useState({ studentCode: '', fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (!form.studentCode || !form.fullName || !form.email || !form.password) { setError('Vui lòng điền đầy đủ'); return }
    setBusy(true)
    try {
      await onRegister({ studentCode: form.studentCode, fullName: form.fullName, email: form.email, password: form.password })
    } catch (err) {
      setError(err?.message || 'Đăng ký thất bại')
    } finally { setBusy(false) }
  }

  return (
    <AuthShell title="Đăng ký tài khoản" subtitle="Xác minh sinh viên để tham gia cộng đồng" onNavigate={onNavigate}>
      <form className="auth-card" onSubmit={submit}>
        <label className="field">Mã SV<span><input type="text" value={form.studentCode} onChange={set('studentCode')} placeholder="SE123456" required /></span></label>
        <label className="field">Họ và tên<span><input type="text" value={form.fullName} onChange={set('fullName')} placeholder="Nguyễn Văn A" required /></span></label>
        <label className="field">Email FPT<span><input type="email" value={form.email} onChange={set('email')} placeholder="email@fpt.edu.vn" required /></span></label>
        <label className="field">Mật khẩu<span><input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} /></span></label>
        <label className="field">Xác nhận mật khẩu<span><input type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required /></span></label>
        {error && <p className="auth-error">{error}</p>}
        <label className="terms"><input type="checkbox" required /> Tôi đồng ý với điều khoản sử dụng</label>
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Đăng ký'}</button>
        <p>Đã có tài khoản?<button onClick={() => onNavigate('login')} type="button">Đăng nhập</button></p>
      </form>
    </AuthShell>
  )
}

export function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) { setError('Vui lòng nhập email'); return }
    setBusy(true)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Gửi yêu cầu thất bại')
    } finally { setBusy(false) }
  }

  if (sent) return (
    <AuthShell title="Đã gửi email" subtitle="Kiểm tra hộp thư của bạn" onNavigate={onNavigate}>
      <div className="auth-card"><p>Link đặt lại mật khẩu đã được gửi đến <strong>{email}</strong>. Vui lòng kiểm tra email (spam nếu không thấy).</p>
        <button className="auth-submit" onClick={() => onNavigate('login')} type="button">Quay lại đăng nhập</button></div>
    </AuthShell>
  )

  return (
    <AuthShell title="Quên mật khẩu" subtitle="Nhập email FPT để nhận link khôi phục" onNavigate={onNavigate}>
      <form className="auth-card" onSubmit={submit}>
        <label className="field">Email FPT<span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@fpt.edu.vn" required /></span></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Gửi yêu cầu'}</button>
        <p>Nhớ mật khẩu?<button onClick={() => onNavigate('login')} type="button">Đăng nhập</button></p>
      </form>
    </AuthShell>
  )
}

export function ResetPasswordPage({ onNavigate }) {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (!token || !password) { setError('Vui lòng điền đầy đủ'); return }
    setBusy(true)
    try {
      await authService.resetPassword({ token, newPassword: password })
      setDone(true)
    } catch (err) {
      setError(err?.message || 'Đặt lại mật khẩu thất bại')
    } finally { setBusy(false) }
  }

  if (done) return (
    <AuthShell title="Thành công!" subtitle="Mật khẩu đã được đặt lại" onNavigate={onNavigate}>
      <div className="auth-card"><button className="auth-submit" onClick={() => onNavigate('login')} type="button">Đăng nhập ngay</button></div>
    </AuthShell>
  )

  return (
    <AuthShell title="Đặt lại mật khẩu" subtitle="Nhập token từ email và mật khẩu mới" onNavigate={onNavigate}>
      <form className="auth-card" onSubmit={submit}>
        <label className="field">Token<span><input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Nhập token từ email" required /></span></label>
        <label className="field">Mật khẩu mới<span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></span></label>
        <label className="field">Xác nhận mk<span><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required /></span></label>
        {error && <p className="auth-error">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</button>
      </form>
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