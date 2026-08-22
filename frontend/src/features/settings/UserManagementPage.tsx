import { Plus, ShieldUser, KeyRound, UserRound } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { PageHeader } from '../../components/ui/PageHeader'
import { ApiError, api } from '../../lib/api'

import './users.css'

interface NewUserForm {
  username: string
  password: string
  currentPassword: string
}

const initialForm: NewUserForm = {
  username: '',
  password: '',
  currentPassword: '',
}

export function UserManagementPage() {
  const [form, setForm] = useState<NewUserForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    if (!form.username.trim() || !form.password.trim() || !form.currentPassword.trim()) {
      setFormError('Vui lòng nhập đủ tài khoản, mật khẩu và mật khẩu admin hiện tại.')
      return
    }

    try {
      setSaving(true)
      setFormError('')
      setSuccess('')
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          current_password: form.currentPassword,
        }),
      })
      setForm(initialForm)
      setSuccess('Đã tạo người dùng.')
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message)
        return
      }
      setFormError(err instanceof Error ? err.message : 'Không thể tạo người dùng.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="settings-page">
      <PageHeader title="Quản lý người dùng" subtitle="Tạo tài khoản staff hoặc admin cho hệ thống" actions={null} />

      {error && <div className="error-banner">{error}</div>}

      <section className="panel settings-users-panel">
        <div className="settings-users-hero">
          <div className="settings-users-icon">
            <ShieldUser size={34} />
          </div>
          <div>
            <h2>Tạo nhân viên mới</h2>
            <p>Điền thông tin để cấp tài khoản cho nhân viên. Chỉ admin hiện tại mới được xác thực thao tác này.</p>
          </div>
        </div>

        <form className="settings-user-form" onSubmit={submit}>
          <label>
            <span><UserRound size={15} /> Tài khoản</span>
            <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="Nhập tài khoản" />
          </label>
          <label>
            <span><KeyRound size={15} /> Mật khẩu nhân viên</span>
            <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Nhập mật khẩu" />
          </label>
          <label>
            <span><KeyRound size={15} /> Mật khẩu admin hiện tại</span>
            <input type="password" value={form.currentPassword} onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))} placeholder="Nhập mật khẩu admin" />
          </label>

          {formError && <div className="form-error">{formError}</div>}
          {success && <div className="form-success">{success}</div>}

          <div className="settings-actions-row">
            <div className="settings-action-note">Mật khẩu admin hiện tại để xác thực thao tác tạo tài khoản.</div>
            <button type="submit" className="primary-button" disabled={saving}>
              <Plus size={16} />
              {saving ? 'Đang tạo...' : 'Tạo nhân viên'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

