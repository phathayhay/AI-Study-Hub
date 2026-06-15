import { useState } from 'react'
import Brand from '../../components/layout/Brand'

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
        <div className="auth-row"><label><input type="checkbox" /> Ghi nhớ đăng nhập</label><a>Quên mật khẩu?</a></div>
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
        <label className="field">Xác nhận mk<span><input type="password" value={form.confirm} onChange={set('confirm')} placeholder="••••••••" required /></span></label>
        {error && <p className="auth-error">{error}</p>}
        <label className="terms"><input type="checkbox" required /> Tôi đồng ý với điều khoản sử dụng</label>
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý...' : 'Đăng ký'}</button>
        <p>Đã có tài khoản?<button onClick={() => onNavigate('login')} type="button">Đăng nhập</button></p>
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