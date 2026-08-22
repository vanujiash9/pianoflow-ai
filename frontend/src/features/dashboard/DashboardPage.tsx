import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { api, fmtDate } from '../../lib/api'
import type { DashboardData } from '../../types'

import './dashboard.css'

function warrantyAppearance(status?: string | null) {
  const value = (status || '').toLowerCase()

  if (value.includes('sắp') || value.includes('expiring')) {
    return { label: 'Sắp hết hạn', className: 'is-expiring' }
  }

  if (value.includes('hết') || value.includes('expired') || value.includes('void')) {
    return { label: 'Hết hạn', className: 'is-expired' }
  }

  if (value.includes('còn') || value.includes('active')) {
    return { label: 'Còn hạn', className: 'is-active' }
  }

  return { label: '—', className: 'is-neutral' }
}

function attentionIcon(type: string) {
  switch (type) {
    case 'warranty':
      return ShieldCheck
    case 'service':
      return Wrench
    default:
      return Users
  }
}

function attentionRoute(type: string) {
  switch (type) {
    case 'warranty':
      return '/warranties'
    case 'service':
      return '/services'
    case 'lead':
      return '/leads'
    default:
      return '/'
  }
}

function DashboardSkeleton() {
  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <h1>Tổng quan hôm nay</h1>
      </header>
      <section className="dashboard-kpis">
        {[1, 2, 3].map((item) => (
          <div className="dashboard-kpi skeleton-card" key={item}>
            <span className="skeleton skeleton-icon" />
            <div className="dashboard-kpi-copy">
              <span className="skeleton skeleton-label" />
              <span className="skeleton skeleton-value" />
            </div>
          </div>
        ))}
      </section>
      <section className="dashboard-main-grid">
        <div className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <span className="skeleton skeleton-title" />
          </div>
          <div className="dashboard-chart-skeleton" />
        </div>
        <div className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <span className="skeleton skeleton-title" />
          </div>
          <div className="dashboard-list-skeleton">
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>
      <section className="dashboard-panel dashboard-customers-panel">
        <div className="dashboard-panel-heading">
          <span className="skeleton skeleton-title" />
        </div>
      </section>
    </div>
  )
}

const SALES_RANGE_OPTIONS = [3, 6, 12] as const

type SalesRange = (typeof SALES_RANGE_OPTIONS)[number]

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const [salesRange, setSalesRange] = useState<SalesRange>(3)

  const navigate = useNavigate()

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .catch((err: Error) => setError(err.message))
  }, [])

  const recentCustomers = useMemo(() => data?.recent_customers.slice(0, 4) ?? [], [data])
  const recentDeletedItems = useMemo(() => data?.recent_deleted_items.slice(0, 3) ?? [], [data])
  const attentionItems = useMemo(() => data?.attention_items.slice(0, 4) ?? [], [data])

  const salesSeries = useMemo(() => {
    const items = data?.sales_by_month ?? []
    return items
  }, [data])

  const salesSummary = useMemo(() => {
    const current = salesSeries.slice(-salesRange)
    const total = current.reduce((sum, item) => sum + item.count, 0)
    const previous = salesSeries.slice(-(salesRange * 2), -salesRange)
    const previousTotal = previous.reduce((sum, item) => sum + item.count, 0)
    const growth = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null
    return { total, growth, current }
  }, [salesRange, salesSeries])

  if (!data) {
    return (
      <>
        {error && <div className="error-banner">{error}</div>}
        <DashboardSkeleton />
      </>
    )
  }

  const kpis = [
    { label: 'Đã bán tháng này', value: data.kpis.sold_this_month, icon: ShoppingBag, tone: 'green', route: '/sales' },
    { label: 'Khách hàng', value: data.kpis.total_customers, icon: Users, tone: 'blue', route: '/customers' },
    { label: 'Cần xử lý', value: data.kpis.action_items, icon: AlertCircle, tone: 'amber', route: '/leads' },
  ]

  const handleRangeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSalesRange(Number(event.target.value) as SalesRange)
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <h1>Tổng quan hôm nay</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="dashboard-kpis">
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              className="dashboard-kpi"
              onClick={() => navigate(item.route)}
            >
              <span className={`dashboard-kpi-icon tone-${item.tone}`}>
                <Icon size={21} strokeWidth={1.8} />
              </span>
              <span className="dashboard-kpi-copy">
                <span className="dashboard-kpi-label">{item.label}</span>
                <strong>{item.value}</strong>
              </span>
              <ChevronRight size={16} className="dashboard-kpi-arrow" />
            </button>
          )
        })}
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading dashboard-chart-heading">
            <button
              type="button"
              className="dashboard-chart-title"
              onClick={() => setSalesRange((value) => (value === 12 ? 3 : (value + 3) as SalesRange))}
            >
              <h2>Bán hàng {salesRange} tháng</h2>
              <ChevronRight size={14} className="dashboard-chart-title-icon" />
            </button>

            <label className="dashboard-range-select">
              <span className="sr-only">Chọn khoảng thời gian</span>
              <select value={salesRange} onChange={handleRangeChange}>
                {SALES_RANGE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value} tháng
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="dashboard-chart-summary">
            <strong>Tổng {salesSummary.total} đơn</strong>
            <span>
              {salesSummary.growth == null
                ? '—'
                : `${salesSummary.growth > 0 ? '+' : ''}${salesSummary.growth}% so với kỳ trước`}
            </span>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesSummary.current} margin={{ top: 8, right: 8, left: -24, bottom: 0 }} barCategoryGap="35%">
                <defs>
                  <linearGradient id="dashboardBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5868f2" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7c6cf3" stopOpacity={0.72} />
                  </linearGradient>
                  <linearGradient id="dashboardBarGradientLast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4658e8" />
                    <stop offset="100%" stopColor="#7668ef" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8b94a5', fontSize: 11 }} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#a0a7b4', fontSize: 10 }} width={36} />
                <Tooltip cursor={{ fill: 'rgba(88, 104, 242, 0.035)' }} formatter={(value) => [`${value} đàn`, 'Đã bán']} contentStyle={{ border: '1px solid #e7eaf1', borderRadius: 10, boxShadow: '0 10px 30px rgba(31, 39, 64, 0.08)', fontSize: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 2, 2]} maxBarSize={48}>
                  <LabelList
                    dataKey="count"
                    position="top"
                    offset={8}
                    fill="#586173"
                    fontSize={11}
                    formatter={(value) => `${value}`}
                  />

                  {salesSeries.map((item, index, items) => (
                    <Cell key={item.month} fill={index === items.length - 1 ? 'url(#dashboardBarGradientLast)' : 'url(#dashboardBarGradient)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel dashboard-customers-panel dashboard-deleted-panel dashboard-deleted-side-panel">
          <div className="dashboard-panel-heading dashboard-customer-heading dashboard-deleted-heading">
            <h2>Khách hàng đã xóa gần đây</h2>
          </div>
          {recentDeletedItems.length === 0 ? (
            <div className="dashboard-empty dashboard-empty-customers">
              Chưa có dữ liệu đã xóa
            </div>
          ) : (
            <div className="dashboard-deleted-list">
              {recentDeletedItems.map((item) => (
                <div className="dashboard-deleted-row" key={`${item.kind}-${item.phone}-${item.deleted_at}`}>
                  <div className="dashboard-customer-cell dashboard-deleted-cell">
                    <div className="dashboard-avatar dashboard-avatar-compact dashboard-deleted-avatar">{item.name.trim().charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.phone}</span>
                      <small>{item.kind === 'lead' ? 'Khách tiềm năng' : 'Khách hàng'}</small>
                    </div>
                  </div>
                  <time>{fmtDate(item.deleted_at)}</time>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panel dashboard-customers-panel">
        <div className="dashboard-panel-heading dashboard-customer-heading">
          <h2>Khách hàng gần đây</h2>
          <button type="button" className="dashboard-view-all" onClick={() => navigate('/customers')}>
            Xem tất cả
            <ChevronRight size={14} />
          </button>
        </div>

        {recentCustomers.length === 0 ? (
          <div className="dashboard-empty dashboard-empty-customers">Chưa có khách hàng</div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Đàn gần nhất</th>
                  <th>Ngày mua</th>
                  <th>Bảo hành</th>
                </tr>
              </thead>
              <tbody>
                {recentCustomers.map((item) => {
                  const warranty = warrantyAppearance(item.warranty_status)
                  return (
                    <tr key={item.phone}>
                      <td>
                        <div className="dashboard-customer-cell">
                          <div className="dashboard-avatar">{item.name.trim().charAt(0).toUpperCase()}</div>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="dashboard-piano-name">{item.last_piano || '—'}</strong>
                      </td>
                      <td>{fmtDate(item.last_purchase_date)}</td>
                      <td>
                        <span className={`dashboard-warranty ${warranty.className}`}>
                          <i />
                          {warranty.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
