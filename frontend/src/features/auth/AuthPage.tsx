import { useMemo, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'

import './auth.css'

export function AuthPage() {
  const { user, login, loading } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSubmitting, setLoginSubmitting] = useState(false)

  const canSubmitLogin = useMemo(() => {
    return loginUsername.trim().length > 0 && loginPassword.length > 0 && !loginSubmitting && !loading
  }, [loginPassword.length, loginSubmitting, loginUsername, loading])

  if (user) return <Navigate to="/" replace />

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmitLogin) return

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

  return (
    <main className="auth-screen">
      <section className="auth-shell is-login">
        <div className="auth-visual" aria-hidden="true">
          <div className="auth-brand">
            <div className="auth-mark">PF</div>
            <div>
              <strong>PianoFlow</strong>
              <span>Âm sắc cho cửa hàng của bạn</span>
            </div>
          </div>

          <p className="auth-visual-note">Piano management</p>
        </div>

        <div className="auth-panel-rail">
          <div className="auth-panel auth-panel-login">
            <div className="auth-panel-copy">
              <p className="auth-label">Đăng nhập</p>
              <h2>Chào mừng trở lại</h2>
              <p>Vào hệ thống quản lý và tiếp tục công việc ngay.</p>
            </div>

            <form className="auth-form" onSubmit={submitLogin}>
              <label>
                Tài khoản
                <input
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Nhập tài khoản"
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
                    placeholder="Nhập mật khẩu"
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

              {loginError ? <div className="form-error">{loginError}</div> : null}

              <button type="submit" className="auth-submit" disabled={!canSubmitLogin}>
                {loginSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>

              <div className="auth-hint">Liên hệ admin để được cấp tài khoản mới.</div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
