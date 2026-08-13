import { CalendarDays, Plus, Search, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Drawer } from '../../components/ui/Drawer'
import { PageHeader } from '../../components/ui/PageHeader'
import { api, fmtDate, getCachedResponse } from '../../lib/api'
import type { Customer, Piano, Sale } from '../../types'

import './sales.css'

type WarrantyFilter = '' | 'active' | 'expired'

interface SaleFormState {
  customer_id: string
  piano_id: string
  sale_date: string
  warranty_months: string
  notes: string
}

const initialFormState: SaleFormState = {
  customer_id: '',
  piano_id: '',
  sale_date: new Date().toISOString().slice(0, 10),
  warranty_months: '12',
  notes: '',
}

function isWarrantyActive(value?: string | null) {
  if (!value) return false
  return new Date(`${value}T23:59:59`).getTime() >= Date.now()
}

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pianos, setPianos] = useState<Piano[]>([])
  const [search, setSearch] = useState('')
  const [warrantyFilter, setWarrantyFilter] = useState<WarrantyFilter>('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SaleFormState>(initialFormState)

  const load = async (refresh = false) => {
    if (!refresh) {
      const salesCached = getCachedResponse<Sale[]>('/sales')
      const customersCached = getCachedResponse<Customer[]>('/customers')
      const pianosCached = getCachedResponse<Piano[]>('/pianos?status=available')
      if (salesCached) setSales(salesCached.data)
      if (customersCached) setCustomers(customersCached.data)
      if (pianosCached) setPianos(pianosCached.data)
    }

    try {
      setLoading(true)
      setError('')
      const [salesData, customersData, pianosData] = await Promise.all([
        api<Sale[]>('/sales'),
        api<Customer[]>('/customers'),
        api<Piano[]>('/pianos?status=available'),
      ])
      setSales(salesData)
      setCustomers(customersData)
      setPianos(pianosData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu bán hàng.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      setError('')
      await api('/sales', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: form.customer_id,
          piano_id: form.piano_id,
          sale_date: form.sale_date,
          warranty_months: Number(form.warranty_months),
          notes: form.notes.trim() || null,
        }),
      })
      setOpen(false)
      setForm(initialFormState)
      await load(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận bán đàn.')
    }
  }

  const thisMonthCount = useMemo(() => {
    const now = new Date()
    return sales.filter((sale) => {
      const date = new Date(`${sale.sale_date}T00:00:00`)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
  }, [sales])

  const activeWarrantyCount = useMemo(() => sales.filter((sale) => isWarrantyActive(sale.warranty_end_date)).length, [sales])

  const filteredSales = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return sales.filter((sale) => {
      if (keyword) {
        const searchable = [sale.customer_name, sale.customer_phone, sale.piano_name, sale.serial_number].filter(Boolean).join(' ').toLowerCase()
        if (!searchable.includes(keyword)) return false
      }
      if (!warrantyFilter) return true
      const active = isWarrantyActive(sale.warranty_end_date)
      return warrantyFilter === 'active' ? active : !active
    })
  }, [sales, search, warrantyFilter])

  return (
    <div className="sales-page">
      <PageHeader title="Bán hàng" subtitle="" actions={<button type="button" className="primary-button sales-create-button" onClick={() => setOpen(true)}><Plus size={17} />Ghi nhận bán đàn</button>} />
      {error && <div className="error-banner">{error}</div>}
      <section className="sales-summary">
        <div className="sales-summary-card"><span className="sales-summary-icon tone-indigo"><ShoppingBag size={21} strokeWidth={1.8} /></span><div><span className="sales-summary-label">Tổng giao dịch</span><strong>{sales.length}</strong></div></div>
        <div className="sales-summary-card"><span className="sales-summary-icon tone-blue"><CalendarDays size={21} strokeWidth={1.8} /></span><div><span className="sales-summary-label">Bán tháng này</span><strong>{thisMonthCount}</strong></div></div>
        <div className="sales-summary-card"><span className="sales-summary-icon tone-green"><ShieldCheck size={21} strokeWidth={1.8} /></span><div><span className="sales-summary-label">Còn bảo hành</span><strong>{activeWarrantyCount}</strong></div></div>
      </section>
      <section className="sales-table-panel">
        <div className="sales-toolbar"><div className="sales-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách hàng, SĐT, đàn hoặc serial" /></div><select className="sales-filter" value={warrantyFilter} onChange={(event) => setWarrantyFilter(event.target.value as WarrantyFilter)}><option value="">Tất cả bảo hành</option><option value="active">Còn bảo hành</option><option value="expired">Hết bảo hành</option></select><span className="sales-result-count">{filteredSales.length} kết quả</span></div>
        {loading ? <div className="sales-empty-state">Đang tải dữ liệu...</div> : filteredSales.length === 0 ? <div className="sales-empty-state">Không có giao dịch.</div> : <div className="sales-table-scroll"><table className="sales-table"><thead><tr><th>Khách hàng</th><th>Đàn</th><th>Serial</th><th>Ngày bán</th><th>Bảo hành</th><th>Ghi chú</th></tr></thead><tbody>{filteredSales.map((sale) => <tr key={sale.id}><td>{sale.customer_name}<div>{sale.customer_phone}</div></td><td>{sale.piano_name}</td><td>{sale.serial_number || '—'}</td><td>{fmtDate(sale.sale_date)}</td><td>{fmtDate(sale.warranty_end_date)}</td><td>{sale.notes || '—'}</td></tr>)}</tbody></table></div>}
      </section>
      <Drawer open={open} title="Ghi nhận bán đàn" onClose={() => setOpen(false)}>
        <form className="form-grid" onSubmit={create}>
          <label><span>Khách hàng</span><select required value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value })}><option value="">Chọn khách</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}</select></label>
          <label><span>Đàn</span><select required value={form.piano_id} onChange={(event) => setForm({ ...form, piano_id: event.target.value })}><option value="">Chọn đàn còn tại shop</option>{pianos.map((piano) => <option key={piano.id} value={piano.id}>{piano.brand} {piano.model}{piano.serial_number ? ` · ${piano.serial_number}` : ''}</option>)}</select></label>
          <label><span>Ngày bán</span><input type="date" required value={form.sale_date} onChange={(event) => setForm({ ...form, sale_date: event.target.value })} /></label>
          <label><span>Bảo hành (tháng)</span><input type="number" min="1" max="120" required value={form.warranty_months} onChange={(event) => setForm({ ...form, warranty_months: event.target.value })} /></label>
          <label className="span-2"><span>Ghi chú</span><textarea rows={3} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <div className="form-actions span-2"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Hủy</button><button type="submit" className="primary-button">Xác nhận bán đàn</button></div>
        </form>
      </Drawer>
    </div>
  )
}