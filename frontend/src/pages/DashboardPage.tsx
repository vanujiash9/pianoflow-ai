import { AlertCircle, Bot, Boxes, CalendarClock, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { KpiCard } from '../components/KpiCard'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { api, fmtDate } from '../lib/api'
import type { DashboardData } from '../types'
import { useNavigate } from 'react-router-dom'
import { useRole } from '../contexts/RoleContext'

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { role } = useRole()

  useEffect(() => {
    api<DashboardData>('/dashboard').then(setData).catch((err: Error) => setError(err.message))
  }, [])

  return (
    <>
      <PageHeader
        title="Tổng quan hôm nay"
        subtitle={role === 'owner' ? 'Nhìn nhanh tình trạng cửa hàng và những việc cần xử lý.' : 'Tập trung vào khách cần hỗ trợ, bảo hành và lịch bảo trì.'}
        actions={<button className="primary-button" onClick={() => navigate('/sales')}>+ Ghi nhận bán đàn</button>}
      />
      {error && <div className="error-banner">{error}</div>}
      {!data ? <div className="loading-card">Đang tải dữ liệu...</div> : (
        <>
          <section className="kpi-grid">
            <KpiCard label="Đàn đang có" value={data.kpis.available_pianos} helper="Sẵn sàng tư vấn" icon={Boxes} tone="blue" />
            <KpiCard label="Đã bán tháng này" value={data.kpis.sold_this_month} helper="Số cây đàn" icon={ShoppingBag} tone="green" />
            <KpiCard label="Khách hàng" value={data.kpis.total_customers} helper="Đã lưu thông tin" icon={Users} tone="violet" />
            <KpiCard label="Cần chú ý" value={data.kpis.action_items} helper="BH · bảo trì · follow-up" icon={AlertCircle} tone="amber" />
          </section>

          <section className="dashboard-grid">
            <div className="panel chart-panel">
              <div className="panel-header"><div><h3>Số đàn bán theo tháng</h3><p>Theo dõi nhịp bán theo số lượng cây đàn.</p></div><span className="soft-pill">6 tháng gần nhất</span></div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.sales_by_month} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5b6df8" stopOpacity={0.3}/><stop offset="95%" stopColor="#5b6df8" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9edf5" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip cursor={{ stroke: '#cbd3ff' }} />
                    <Area type="monotone" dataKey="count" stroke="#5b6df8" fill="url(#salesFill)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel attention-panel">
              <div className="panel-header"><div><h3>Cần xử lý</h3><p>Những việc gần hạn nhất.</p></div><CalendarClock size={19} /></div>
              <div className="attention-list">
                {data.attention_items.length === 0 ? <EmptyState title="Không có việc gấp" description="Danh sách sẽ xuất hiện khi có bảo hành, bảo trì hoặc follow-up gần hạn." /> : data.attention_items.map((item, index) => (
                  <div className="attention-row" key={`${item.type}-${index}`}>
                    <div className={`attention-dot priority-${item.priority}`} />
                    <div className="attention-copy"><strong>{item.title}</strong><span>{item.subtitle}</span></div>
                    <time>{fmtDate(item.due_date)}</time>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="dashboard-grid lower-grid">
            <div className="panel">
              <div className="panel-header"><div><h3>Khách gần đây</h3><p>Tra nhanh đàn đã mua và trạng thái bảo hành.</p></div><button className="text-button" onClick={() => navigate('/customers')}>Xem tất cả</button></div>
              <div className="table-scroll">
                <table><thead><tr><th>Khách</th><th>SĐT</th><th>Đàn gần nhất</th><th>Ngày mua</th><th>Bảo hành</th></tr></thead>
                <tbody>{data.recent_customers.map((item) => <tr key={item.phone}><td><strong>{item.name}</strong></td><td>{item.phone}</td><td>{item.last_piano || '—'}</td><td>{fmtDate(item.last_purchase_date)}</td><td><span className="simple-status">{item.warranty_status || '—'}</span></td></tr>)}</tbody></table>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}
