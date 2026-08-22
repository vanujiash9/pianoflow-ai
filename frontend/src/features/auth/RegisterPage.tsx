import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

import './auth.css'

export function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    try {
      setSubmitting(true)
      setError('')
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password, role }),
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo tài khoản.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card">
        <h1>Tạo tài khoản nội bộ</h1>
        <p>Chỉ admin được phép tạo tài khoản mới.</p>
        <form onSubmit={submit} className="login-form">
          <label>
            Tài khoản
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label>
            Mật khẩu
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          <label>
            Vai trò
            <select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
      </section>
    </main>
  )
}
