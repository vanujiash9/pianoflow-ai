import {
  CalendarClock,
  Check,
  Eye,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'

import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { api, fmtDate, fmtMoney, getCachedResponse, ApiError } from '../../lib/api'
import type { Customer, Lead, LeadStatus } from '../../types'

import './leads.css'

const empty = {
  customer_name: '',
  phone: '',
  budget_min: '',
  budget_max: '',
  interested_brand: '',
  interested_model: '',
  status: 'new' as LeadStatus,
  follow_up_date: '',
  notes: '',
  address: '',
}

function normalizePhone(value: string) {
  return value.trim().replace(/[\s\-()]/g, '')
}

function isFollowUpSoon(value?: string | null) {
  if (!value) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${value}T00:00:00`)
  const max = new Date(today)
  max.setDate(max.getDate() + 14)
  return target.getTime() >= today.getTime() && target.getTime() <= max.getTime()
}

function formatBudget(min?: number | null, max?: number | null) {
  if (min != null && max != null) return `${fmtMoney(min)} – ${fmtMoney(max)}`
  if (min != null) return `Từ ${fmtMoney(min)}`
  if (max != null) return `Đến ${fmtMoney(max)}`
  return 'Chưa xác định'
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('')
  const [brandFilter, setBrandFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null)

  const load = async (refresh = false, searchValue = search) => {
    const normalized = searchValue.trim()
    const path = `/leads${normalized ? `?search=${encodeURIComponent(normalized)}` : ''}`
    const cached = !refresh ? getCachedResponse<Lead[]>(path) : null
    if (cached) setItems(cached.data)
    try {
      if (!cached) setLoading(true)
      setError('')
      const rows = await api<Lead[]>(path)
      setItems(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải khách đang quan tâm.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, creating])

  useEffect(() => {
    if (!open) return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = oldOverflow
    }
  }, [open])

  const resetDrawer = () => {
    setForm(empty)
    setFormError('')
    setMatchedCustomer(null)
    setLookupDone(false)
    setLookupLoading(false)
  }

  const openDrawer = () => {
    resetDrawer()
    setOpen(true)
  }

  const closeDrawer = () => {
    if (creating) return
    setOpen(false)
    setFormError('')
  }

  const lookupCustomer = async (phoneValue: string) => {
    const normalized = normalizePhone(phoneValue)
    setForm((current) => ({ ...current, phone: phoneValue }))

    if (!normalized || normalized.length < 8) {
      setMatchedCustomer(null)
      setLookupDone(false)
      return
    }

    setLookupLoading(true)
    setFormError('')
    try {
      const customers = await api<Customer[]>(`/customers?search=${encodeURIComponent(normalized)}`)
      const found = customers.find((item) => normalizePhone(item.phone) === normalized) ?? null
      setMatchedCustomer(found)
      setLookupDone(true)
      if (found) {
        setForm((current) => ({ ...current, customer_name: found.name, address: found.address || '' }))
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tra cứu khách hàng.')
    } finally {
      setLookupLoading(false)
    }
  }

  const ensureCustomer = async () => {
    if (matchedCustomer) return matchedCustomer
    const name = form.customer_name.trim()
    const phone = normalizePhone(form.phone)
    const address = form.address.trim()
    if (!name) throw new Error('Vui lòng nhập họ tên khách hàng.')
    const customer = await api<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({ name, phone, address: address || null, notes: null }),
    })
    setMatchedCustomer(customer)
    return customer
  }

  const create = async (event: FormEvent) => {
    event.preventDefault()
    if (creating) return

    try {
      setCreating(true)
      setError('')
      setFormError('')

      const normalizedPhone = normalizePhone(form.phone)
      if (!normalizedPhone) {
        setFormError('Vui lòng nhập số điện thoại.')
        return
      }

      if (!lookupDone && !matchedCustomer) {
        await lookupCustomer(form.phone)
      }

      const budgetMin = form.budget_min ? Number(form.budget_min) : null
      const budgetMax = form.budget_max ? Number(form.budget_max) : null
      if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
        setFormError('Ngân sách từ không được lớn hơn ngân sách đến.')
        return
      }

      const customer = await ensureCustomer()

      await api('/leads', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customer.id,
          budget_min: budgetMin,
          budget_max: budgetMax,
          interested_brand: form.interested_brand.trim() || null,
          interested_model: form.interested_model.trim() || null,
          status: form.status,
          follow_up_date: form.follow_up_date || null,
          notes: form.notes.trim() || null,
        }),
      })

      setOpen(false)
      resetDrawer()
      setSearch('')
      setStatusFilter('')
      setBrandFilter('')
      await load(true, '')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError(err.message)
        return
      }
      setFormError(err instanceof Error ? err.message : 'Không thể thêm khách.')
    } finally {
      setCreating(false)
    }
  }

  const updateStatus = async (id: string, status: LeadStatus) => {
    try {
      setError('')
      await api(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await load(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.')
    }
  }

  const deleteLead = async (leadId: string, customerName: string) => {
    if (!window.confirm(`Xóa khách quan tâm ${customerName}?`)) return
    try {
      setError('')
      await api(`/leads/${leadId}`, { method: 'DELETE' })
      await load(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa khách quan tâm.')
    }
  }

  const brands = useMemo(
    () => Array.from(new Set(items.map((item) => item.interested_brand?.trim()).filter((value): value is string => Boolean(value)))).sort(),
    [items],
  )

  const filteredItems = useMemo(
    () => items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false
      if (brandFilter && item.interested_brand !== brandFilter) return false
      return true
    }),
    [items, statusFilter, brandFilter],
  )

  const followUpCount = useMemo(() => items.filter((item) => isFollowUpSoon(item.follow_up_date)).length, [items])
  const visitedCount = useMemo(() => items.filter((item) => item.status === 'visited').length, [items])
  const consideringCount = useMemo(() => items.filter((item) => item.status === 'considering').length, [items])

  return (
    <div className="leads-page">
      <PageHeader title="Khách đang quan tâm" subtitle="Theo dõi người chưa mua và cơ hội trước khi chốt" actions={<button type="button" className="primary-button leads-add-button" onClick={openDrawer}><Plus size={17} />Thêm khách quan tâm</button>} />

      {error && <div className="error-banner">{error}</div>}

      <section className="leads-summary">
        <div className="lead-summary-card"><span className="lead-summary-icon tone-indigo"><Users size={21} /></span><div><span>Tổng khách quan tâm</span><strong>{items.length}</strong></div></div>
        <div className="lead-summary-card"><span className="lead-summary-icon tone-green"><CalendarClock size={21} /></span><div><span>Cần gọi lại</span><strong>{followUpCount}</strong><small>Trong 14 ngày tới</small></div></div>
        <div className="lead-summary-card"><span className="lead-summary-icon tone-blue"><Eye size={21} /></span><div><span>Đã ghé shop</span><strong>{visitedCount}</strong></div></div>
        <div className="lead-summary-card"><span className="lead-summary-icon tone-amber"><UserRound size={21} /></span><div><span>Đang cân nhắc</span><strong>{consideringCount}</strong></div></div>
      </section>

      <section className="leads-toolbar">
        <form className="leads-search" onSubmit={(event) => { event.preventDefault(); void load(true, search) }}>
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc số điện thoại..." />
          {search.trim() && <button type="submit">Tìm</button>}
        </form>

        <div className="leads-filter-field"><span>Hãng quan tâm</span><select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}><option value="">Tất cả</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
        <div className="leads-filter-field"><span>Trạng thái</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as LeadStatus | '')}><option value="">Tất cả</option><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="visited">Đã ghé shop</option><option value="considering">Đang cân nhắc</option></select></div>
        <span className="leads-result-count">{filteredItems.length} khách</span>
      </section>

      <section className="leads-table-panel">
        {loading && items.length === 0 ? <div className="leads-empty-state">Đang tải dữ liệu...</div> : filteredItems.length === 0 ? <div className="leads-empty-state"><UserRound size={22} /><strong>Chưa có khách phù hợp</strong><span>Thử thay đổi tìm kiếm hoặc bộ lọc.</span></div> : <>
          <div className="leads-table-scroll">
            <table className="leads-table">
              <thead><tr><th>Khách hàng</th><th>SĐT</th><th>Quan tâm</th><th>Ngân sách</th><th>Trạng thái</th><th>Gọi lại</th><th>Ghi chú</th><th /></tr></thead>
              <tbody>
                {filteredItems.map((item) => <tr key={item.id}>
                  <td><div className="lead-customer"><div className="lead-avatar">{getInitials(item.customer.name)}</div><strong>{item.customer.name}</strong></div></td>
                  <td className="lead-phone">{item.customer.phone}</td>
                  <td><div className="lead-interest"><strong>{item.interested_brand || 'Chưa rõ hãng'}</strong>{item.interested_model && <span>{item.interested_model}</span>}</div></td>
                  <td><span className="lead-budget">{formatBudget(item.budget_min, item.budget_max)}</span></td>
                  <td><select className={`lead-status-select status-${item.status}`} value={item.status} onChange={(event) => void updateStatus(item.id, event.target.value as LeadStatus)}><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="visited">Đã ghé shop</option><option value="considering">Đang cân nhắc</option><option value="won">Đã chuyển đổi</option></select></td>
                  <td><span className={isFollowUpSoon(item.follow_up_date) ? 'lead-followup due' : 'lead-followup'}>{item.follow_up_date ? fmtDate(item.follow_up_date) : '—'}</span></td>
                  <td><span className="lead-note">{item.notes || '—'}</span></td>
                  <td><button type="button" className="lead-delete-button" aria-label={`Xóa khách quan tâm ${item.customer.name}`} onClick={() => void deleteLead(item.id, item.customer.name)}><Trash2 size={16} /></button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <footer className="leads-table-footer"><span>Hiển thị {filteredItems.length} khách quan tâm</span>{loading && <span>Đang cập nhật...</span>}</footer>
        </>}
      </section>

      <div className={open ? 'lead-drawer-overlay open' : 'lead-drawer-overlay'} onMouseDown={(event) => { if (event.target === event.currentTarget) closeDrawer() }}>
        <aside className={open ? 'lead-drawer open' : 'lead-drawer'} aria-hidden={!open}>
          <header className="lead-drawer-header">
            <div><h2>Thêm khách quan tâm</h2><p>Lưu nhu cầu của người chưa mua để theo dõi và tư vấn sau.</p></div>
            <button type="button" className="lead-drawer-close" onClick={closeDrawer} aria-label="Đóng"><X size={19} /></button>
          </header>

          <form className="lead-drawer-form" onSubmit={create}>
            <div className="lead-drawer-body">
              {formError && <div className="lead-form-error">{formError}</div>}

              <div className="lead-form-grid">
                <label className="lead-form-full"><span>Số điện thoại<b>*</b></span><input required autoFocus value={form.phone} placeholder="Nhập số điện thoại" onBlur={(event) => { void lookupCustomer(event.target.value) }} onChange={(event) => { setFormError(''); setForm((current) => ({ ...current, phone: event.target.value })) }} /></label>

                <div className="lead-form-full lead-lookup-state">{lookupLoading ? <span><Loader2 size={14} className="spin" /> Đang tra cứu khách hàng...</span> : matchedCustomer ? <span><Check size={14} /> Đã tìm thấy khách hàng: <strong>{matchedCustomer.name}</strong> · {matchedCustomer.phone}</span> : lookupDone ? <span>Chưa có khách hàng. Nhập thêm thông tin để tạo mới.</span> : <span>Nhập số điện thoại để tra cứu khách hàng.</span>}</div>

                {!matchedCustomer && (
                  <>
                    <label><span>Họ tên<b>*</b></span><input required value={form.customer_name} placeholder="Nhập họ tên" onChange={(event) => setForm((current) => ({ ...current, customer_name: event.target.value }))} /></label>
                    <label><span>Địa chỉ</span><input value={form.address} placeholder="Nhập địa chỉ" onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
                  </>
                )}

                <label><span>Ngân sách từ</span><input type="number" min="0" value={form.budget_min} placeholder="VD: 30000000" onChange={(event) => setForm((current) => ({ ...current, budget_min: event.target.value }))} /></label>
                <label><span>Đến</span><input type="number" min="0" value={form.budget_max} placeholder="VD: 60000000" onChange={(event) => setForm((current) => ({ ...current, budget_max: event.target.value }))} /></label>
                <label><span>Hãng quan tâm</span><input value={form.interested_brand} placeholder="VD: Kawai" onChange={(event) => setForm((current) => ({ ...current, interested_brand: event.target.value }))} /></label>
                <label><span>Model</span><input value={form.interested_model} placeholder="VD: KL-901" onChange={(event) => setForm((current) => ({ ...current, interested_model: event.target.value }))} /></label>
                <label><span>Trạng thái</span><select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as LeadStatus }))}><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="visited">Đã ghé shop</option><option value="considering">Đang cân nhắc</option><option value="won">Đã chuyển đổi</option></select></label>
                <label><span>Ngày gọi lại</span><input type="date" value={form.follow_up_date} onChange={(event) => setForm((current) => ({ ...current, follow_up_date: event.target.value }))} /></label>
                <label className="lead-form-full"><span>Ghi chú</span><textarea rows={5} maxLength={300} value={form.notes} placeholder="Thông tin cần nhớ khi tư vấn khách..." onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} /><small>{form.notes.length}/300</small></label>
              </div>
            </div>

            <footer className="lead-drawer-footer">
              <button type="button" className="secondary-button" disabled={creating} onClick={closeDrawer}>Hủy</button>
              <button type="submit" className="primary-button" disabled={creating}>{creating ? 'Đang lưu...' : 'Lưu khách'}</button>
            </footer>
          </form>
        </aside>
      </div>
    </div>
  )
}
