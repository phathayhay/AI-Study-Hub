import { useState } from 'react'
import Brand from '../../components/layout/Brand'
import StudyHubIcon from '../../components/icons/StudyHubIcons'

export function LoginPage({ onLogin, onNavigate }) {
  const [role, setRole] = useState('student')

  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng trở lại!" onNavigate={onNavigate}>
      <div className="auth-shortcuts">
        <button
          className={role === 'admin' ? 'is-active' : ''}
          onClick={() => setRole('admin')}
          type="button"
        >
          Admin
        </button>
        <button
          className={role === 'student' ? 'is-active' : ''}
          onClick={() => setRole('student')}
          type="button"
        >
          Sinh viên
        </button>
      </div>
      <AuthCard>
        <Field icon="mail" label="Email FPT" value={role === 'admin' ? 'admin@fpt.edu.vn' : 'student@fpt.edu.vn'} />
        <Field icon="lock" label="Mật khẩu" value={role === 'admin' ? 'admin123' : 'student123'} type="password" />
        <div className="auth-row"><label><input type="checkbox" /> Ghi nhớ đăng nhập</label><a>Quên mật khẩu?</a></div>
        <button className="auth-submit" type="button" onClick={() => onLogin(role)}>Đăng nhập</button>
        <p>Chưa có tài khoản?<button onClick={() => onNavigate('register')} type="button">Đăng ký ngay</button></p>
        <hr />
        <small><strong>Demo Accounts:</strong><br />Admin: admin@fpt.edu.vn / admin123<br />User: student@fpt.edu.vn / student123</small>
      </AuthCard>
    </AuthShell>
  )
}

export function RegisterPage({ onNavigate }) {
  return (
    <AuthShell title="Đăng ký tài khoản" subtitle="Xác minh sinh viên để tham gia cộng đồng" onNavigate={onNavigate}>
      <AuthCard>
        <Field icon="user" label="Họ và tên" value="Nguyễn Văn A" />
        <Field icon="mail" label="Email" value="email@example.com" />
        <Field icon="lock" label="Mật khẩu" value="••••••••" />
        <Field icon="lock" label="Xác nhận mật khẩu" value="••••••••" />
        <label className="verify-upload">Xác minh sinh viên *<span><StudyHubIcon name="upload" size={34} />Tải lên ảnh thẻ sinh viên<small>PNG, JPG, JPEG (tối đa 5MB)</small></span></label>
        <div className="notice">Lưu ý: Ảnh xác minh giúp đảm bảo bạn là sinh viên FPT.</div>
        <label className="terms"><input type="checkbox" /> Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật</label>
        <button className="auth-submit is-disabled" type="button">Đăng ký</button>
        <p>Đã có tài khoản?<button onClick={() => onNavigate('login')} type="button">Đăng nhập</button></p>
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

function AuthCard({ children }) {
  return <section className="auth-card">{children}</section>
}

function Field({ icon, label, type = 'text', value }) {
  return (
    <label className="field">
      {label}
      <span><StudyHubIcon name={icon} size={18} /><input key={value} defaultValue={value} type={type} /></span>
    </label>
  )
}
