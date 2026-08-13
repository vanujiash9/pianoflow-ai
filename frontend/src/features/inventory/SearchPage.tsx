import { Piano, Search, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { api } from '../../lib/api'
import type { Customer, Piano as PianoType } from '../../types'

export function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() || ''
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pianos, setPianos] = useState<PianoType[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!query) {
      setLoading(false)
      return
    }
    setLoading(true)
    Promise.all([
      api<Customer[]>(`/customers?search=${encodeURIComponent(query)}`),
      api<PianoType[]>(`/pianos?search=${encodeURIComponent(query)}`),
    ])
      .then(([customerRows, pianoRows]) => {
        setCustomers(customerRows)
        setPianos(pianoRows)
        setError('')
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [query])

  return <>
    <PageHeader title="Tìm nhanh" subtitle=""/>
    {error && <div className="error-banner">{error}</div>}
    {loading ? <div className="loading-card">Đang tải...</div> : <div className="search-results-grid">
      <section className="panel search-result-panel">
        <div className="panel-header"><div><h3>Khách hàng</h3><p>{customers.length} kết quả</p></div><UserRound size={18}/></div>
        {customers.length === 0 ? <div className="search-empty-state"><strong>Không thấy khách</strong><span>Dữ liệu mới sẽ xuất hiện tại đây.</span></div> : <div className="compact-list">{customers.map((item) => <div className="compact-row" key={item.id}><div className="person-icon"><UserRound size={16}/></div><div><strong>{item.name}</strong><span>{item.phone} · {item.address || 'Chưa có địa chỉ'}</span></div></div>)}</div>}
      </section>
      <section className="panel search-result-panel">
        <div className="panel-header"><div><h3>Đàn</h3><p>{pianos.length} kết quả</p></div><Piano size={18}/></div>
        {pianos.length === 0 ? <div className="search-empty-state"><strong>Không thấy đàn</strong><span>Dữ liệu mới sẽ xuất hiện tại đây.</span></div> : <div className="compact-list">{pianos.map((item) => <div className="compact-row" key={item.id}><div className="person-icon"><Search size={16}/></div><div className="grow"><strong>{item.brand} {item.model}</strong><span className="mono">{item.serial_number} · {item.year || 'Chưa rõ năm'}</span></div><StatusBadge value={item.status}/></div>)}</div>}
      </section>
    </div>}
  </>
}
