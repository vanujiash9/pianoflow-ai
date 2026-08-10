import { Plus, Search, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { Modal } from '../components/Modal'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { api, fmtDate } from '../lib/api'
import type { Customer, CustomerProfile } from '../types'

const emptyForm = { name: '', phone: '', address: '', notes: '' }

export function CustomersPage() {
  const [params, setParams] = useSearchParams()
  const initialSearch = params.get('search') || ''
  const [search, setSearch] = useState(initialSearch)
  const [items, setItems] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const load = async (q = search) => {
    try {
      setError('')
      const query = q.trim() ? `?search=${encodeURIComponent(q.trim())}` : ''
      setItems(await api<Customer[]>(`/customers${query}`))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  useEffect(() => { void load(initialSearch) }, [])
  const subtitle = useMemo(() => `${items.length} khách đang hiển thị`, [items.length])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setParams(search.trim() ? { search } : {})
    void load()
  }

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await api<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          address: form.address || null,
          notes: form.notes || null,
        }),
      })
      setForm(emptyForm)
      setOpen(false)
      await load('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const openProfile = async (customerId: string) => {
    setProfileLoading(true)
    setProfile(null)
    try {
      setProfile(await api<CustomerProfile>(`/customers/${customerId}/profile`))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProfileLoading(false)
    }
  }

  return <>
    <PageHeader
      title="Khách hàng"
      subtitle="Lưu thông tin để tra cứu lịch sử mua, bảo hành và bảo trì."
      actions={<button className="primary-button" onClick={() => setOpen(true)}><Plus size={17}/> Thêm khách</button>}
    />
    {error && <div className="error-banner">{error}</div>}
    <div className="panel">
      <div className="toolbar compact">
        <form className="inline-search" onSubmit={submitSearch}>
          <Search size={17}/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tên hoặc số điện thoại"/>
          <button>Tìm</button>
        </form>
        <span className="muted">{subtitle}</span>
      </div>
      <div className="panel-subline" />
      {items.length === 0
        ? <EmptyState title="Chưa có khách phù hợp" description="Thêm khách mới hoặc thử từ khóa khác."/>
        : <div className="table-scroll"><table><thead><tr><th>Khách hàng</th><th>Số điện thoại</th><th>Địa chỉ</th><th>Ghi chú</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="clickable-row" onClick={() => void openProfile(item.id)}><td><div className="person-cell"><div className="person-icon"><UserRound size={16}/></div><strong>{item.name}</strong></div></td><td>{item.phone}</td><td>{item.address || '—'}</td><td className="notes-cell">{item.notes || '—'}</td></tr>)}</tbody></table></div>}
    </div>

    <Modal open={open} title="Thêm khách hàng" onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={create}>
        <label>Họ tên<input required value={form.name} onChange={(e) => setForm({...form, name:e.target.value})}/></label>
        <label>Số điện thoại<input required value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})}/></label>
        <label className="span-2">Địa chỉ<input value={form.address} onChange={(e) => setForm({...form, address:e.target.value})}/></label>
        <label className="span-2">Ghi chú<textarea rows={3} value={form.notes} onChange={(e) => setForm({...form, notes:e.target.value})}/></label>
        <div className="form-actions span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button">Lưu khách hàng</button></div>
      </form>
    </Modal>

    <Modal open={profileLoading || Boolean(profile)} title="Hồ sơ khách hàng" onClose={() => { setProfile(null); setProfileLoading(false) }}>
      {profileLoading && <div className="loading-card">Đang tải lịch sử khách...</div>}
      {profile && <div className="customer-profile">
        <div className="profile-hero">
          <div className="person-icon large"><UserRound size={22}/></div>
          <div><h3>{profile.customer.name}</h3><p>{profile.customer.phone} · {profile.customer.address || 'Chưa có địa chỉ'}</p>{profile.customer.notes && <span>{profile.customer.notes}</span>}</div>
        </div>
        <section className="profile-section">
          <div className="section-title"><h4>Đàn đã mua</h4><span>{profile.purchases.length} cây</span></div>
          {profile.purchases.length === 0 ? <EmptyState title="Chưa có lịch sử mua" description="Khi ghi nhận bán đàn, dữ liệu sẽ xuất hiện tại đây."/> : <div className="profile-list">{profile.purchases.map((item) => <div className="profile-item" key={item.piano_id}><div><strong>{item.piano_name}</strong><span className="mono">{item.serial_number}</span></div><div><span>Mua {fmtDate(item.sale_date)}</span><span>BH đến {fmtDate(item.warranty_end_date)}</span></div>{item.warranty_status && <StatusBadge value={item.warranty_status}/>}</div>)}</div>}
        </section>
        <section className="profile-section">
          <div className="section-title"><h4>Bảo trì / sửa chữa</h4><span>{profile.services.length} lần</span></div>
          {profile.services.length === 0 ? <div className="profile-empty">Chưa có lịch sử bảo trì.</div> : <div className="profile-list">{profile.services.map((item, index) => <div className="profile-item" key={`${item.piano_name}-${item.service_date}-${index}`}><div><strong>{item.service_type}</strong><span>{item.piano_name}</span></div><div><span>{fmtDate(item.service_date)}</span><span>Lần tới {fmtDate(item.next_service_date)}</span></div><StatusBadge value={item.status}/></div>)}</div>}
        </section>
      </div>}
    </Modal>
  </>
}
