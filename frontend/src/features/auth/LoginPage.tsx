import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'

import './auth.css'

type AuthPanel = 'login' | 'register'

export function LoginPage() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()
  const [panel, setPanel] = useState<AuthPanel>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerRole, setRegisterRole] = useState<'staff' | 'admin'>('staff')
  const [registerError, setRegisterError] = useState('')
  const [registerSubmitting, setRegisterSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault()
    if (loginSubmitting) return

    try {
      setLoginSubmitting(true)
      setLoginError('')
      await login(loginUsername.trim(), loginPassword)
      navigate('/', { replace: true })
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sai tài khoản hoặc mật khẩu.')
    } finally {
      setLoginSubmitting(false)
    }
  }

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault()
    if (registerSubmitting) return

    try {
      setRegisterSubmitting(true)
      setRegisterError('')
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerUsername.trim(),
          password: registerPassword,
          role: registerRole,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null
        throw new Error(payload?.detail || 'Không thể tạo tài khoản.')
      }

      setPanel('login')
      setRegisterUsername('')
      setRegisterPassword('')
      setRegisterRole('staff')
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : 'Không thể tạo tài khoản.')
    } finally {
      setRegisterSubmitting(false)
    }
  }

  const openRegister = () => setPanel('register')
  const openLogin = () => setPanel('login')

  return (
    <main className="auth-screen">
      <section className={`auth-shell ${panel === 'register' ? 'auth-shell-register' : ''}`}>
        <div className="auth-mobile-switcher" role="tablist" aria-label="Chuyển màn hình đăng nhập">
          <button
            type="button"
            role="tab"
            aria-selected={panel === 'login'}
            className={panel === 'login' ? 'selected' : ''}
            onClick={openLogin}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={panel === 'register'}
            className={panel === 'register' ? 'selected' : ''}
            onClick={openRegister}
          >
            Đăng ký
          </button>
        </div>

        <section className="auth-panels">
          <div className="auth-panel auth-panel-login">
            <div className="auth-panel-head">
              <p className="auth-label">Chào mừng trở lại</p>
              <button type="button" className="auth-switch" onClick={openRegister}>
                Đăng ký
              </button>
            </div>

            <h1>Đăng nhập PianoFlow</h1>
            <p className="auth-subcopy">Chỉ tài khoản nội bộ được phép truy cập.</p>

            <form className="auth-form" onSubmit={submitLogin}>
              <label>
                Tài khoản
                <input
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                Mật khẩu
                <div className="auth-password-row">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-mini-button"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
              </label>

              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Ghi nhớ đăng nhập
              </label>

              {loginError ? <div className="form-error">{loginError}</div> : null}

              <button type="submit" className="auth-submit" disabled={loginSubmitting || loading}>
                {loginSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <Link to="/register" className="auth-link">
                Tạo tài khoản nội bộ
              </Link>
            </form>
          </div>

          <div className="auth-panel auth-panel-register">
            <div className="auth-panel-head">
              <p className="auth-label">Tạo tài khoản</p>
              <button type="button" className="auth-switch" onClick={openLogin}>
                Đăng nhập
              </button>
            </div>

            <h1>Đăng ký nội bộ</h1>
            <p className="auth-subcopy">Chỉ admin đang đăng nhập mới tạo được tài khoản mới.</p>

            <form className="auth-form" onSubmit={submitRegister}>
              <label>
                Tài khoản
                <input
                  value={registerUsername}
                  onChange={(event) => setRegisterUsername(event.target.value)}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                Mật khẩu
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>

              <label>
                Vai trò
                <select value={registerRole} onChange={(event) => setRegisterRole(event.target.value as 'staff' | 'admin')}>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </label>

              {registerError ? <div className="form-error">{registerError}</div> : null}

              <button type="submit" className="auth-submit" disabled={registerSubmitting}>
                {registerSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>

              <button type="button" className="auth-link auth-link-button" onClick={openLogin}>
                Quay lại đăng nhập
              </button>
            </form>
          </div>
        </section>
      </section>
    </main>
  )
}
