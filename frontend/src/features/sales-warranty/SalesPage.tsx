import { CalendarDays, Search, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      <PageHeader title="Lịch sử bán" subtitle="Theo dõi giao dịch, tình trạng bảo hành và lịch sử bán hàng." />
      {error && <div className="error-banner">{error}</div>}
      <section className="sales-summary">
        <div className="sales-summary-card"><span className="sales-summary-icon tone-indigo"><ShoppingBag size={21} strokeWidth={1.8} /></span><div><span className="sales-summary-label">Giao dịch đã lưu</span><strong>{sales.length}</strong></div></div>
        <div className="sales-summary-card"><span className="sales-summary-icon tone-blue"><CalendarDays size={21} strokeWidth={1.8} /></span><div><span className="sales-summary-label">Phát sinh tháng này</span><strong>{thisMonthCount}</strong></div></div>
        <div className="sales-summary-card"><span className="sales-summary-icon tone-green"><ShieldCheck size={21} strokeWidth={1.8} /></span><div><span className="sales-summary-label">Đang còn bảo hành</span><strong>{activeWarrantyCount}</strong></div></div>
      </section>
      <section className="sales-table-panel">
        <div className="sales-toolbar"><div className="sales-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm khách, đàn, serial hoặc số điện thoại" /></div><select className="sales-filter" value={warrantyFilter} onChange={(event) => setWarrantyFilter(event.target.value as WarrantyFilter)}><option value="">Tất cả trạng thái</option><option value="active">Còn bảo hành</option><option value="expired">Hết bảo hành</option></select><span className="sales-result-count">{filteredSales.length} kết quả</span></div>
        {loading ? <div className="sales-empty-state">Đang tải dữ liệu...</div> : filteredSales.length === 0 ? <div className="sales-empty-state">Không có giao dịch.</div> : <div className="sales-table-scroll"><table className="sales-table"><thead><tr><th>Khách hàng</th><th>Đàn</th><th>Serial</th><th>Ngày bán</th><th>Bảo hành</th><th>Ghi chú</th></tr></thead><tbody>{filteredSales.map((sale) => <tr key={sale.id}><td>{sale.customer_name}<div>{sale.customer_phone}</div></td><td>{sale.piano_name}</td><td>{sale.serial_number || '—'}</td><td>{fmtDate(sale.sale_date)}</td><td>{fmtDate(sale.warranty_end_date)}</td><td>{sale.notes || '—'}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}