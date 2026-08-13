import {
  AlertCircle,
  Boxes,
  CalendarClock,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
    return {
      label: 'Sắp hết hạn',
      className: 'is-expiring',
    }
  }

  if (
    value.includes('hết') ||
    value.includes('expired') ||
    value.includes('void')
  ) {
    return {
      label: 'Hết hạn',
      className: 'is-expired',
    }
  }

  if (value.includes('còn') || value.includes('active')) {
    return {
      label: 'Còn hạn',
      className: 'is-active',
    }
  }

  return {
    label: '—',
    className: 'is-neutral',
  }
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
        {[1, 2, 3, 4].map((item) => (
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

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    api<DashboardData>('/dashboard')
      .then(setData)
      .catch((err: Error) => setError(err.message))
  }, [])

  const recentCustomers = useMemo(
    () => data?.recent_customers.slice(0, 4) ?? [],
    [data],
  )

  const attentionItems = useMemo(
    () => data?.attention_items.slice(0, 4) ?? [],
    [data],
  )

  if (!data) {
    return (
      <>
        {error && <div className="error-banner">{error}</div>}
        <DashboardSkeleton />
      </>
    )
  }

  const kpis = [
    {
      label: 'Đàn tại shop',
      value: data.kpis.available_pianos,
      icon: Boxes,
      tone: 'indigo',
      route: '/pianos',
    },
    {
      label: 'Đã bán tháng này',
      value: data.kpis.sold_this_month,
      icon: ShoppingBag,
      tone: 'green',
      route: '/sales',
    },
    {
      label: 'Khách hàng',
      value: data.kpis.total_customers,
      icon: Users,
      tone: 'blue',
      route: '/customers',
    },
    {
      label: 'Cần xử lý',
      value: data.kpis.action_items,
      icon: AlertCircle,
      tone: 'amber',
      route: null,
    },
  ]

  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <h1>Tổng quan hôm nay</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {/* KPI */}
      <section className="dashboard-kpis">
        {kpis.map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.label}
              type="button"
              className="dashboard-kpi"
              onClick={() => {
                if (item.route) navigate(item.route)
              }}
              disabled={!item.route}
            >
              <span className={`dashboard-kpi-icon tone-${item.tone}`}>
                <Icon size={21} strokeWidth={1.8} />
              </span>

              <span className="dashboard-kpi-copy">
                <span className="dashboard-kpi-label">
                  {item.label}
                </span>

                <strong>{item.value}</strong>
              </span>

              {item.route && (
                <ChevronRight
                  size={16}
                  className="dashboard-kpi-arrow"
                />
              )}
            </button>
          )
        })}
      </section>

      {/* CHART + ATTENTION */}
      <section className="dashboard-main-grid">
        <article className="dashboard-panel dashboard-chart-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Bán hàng 6 tháng</h2>
            </div>

            <span className="dashboard-period">6 tháng</span>
          </div>

          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.sales_by_month}
                margin={{
                  top: 8,
                  right: 8,
                  left: -24,
                  bottom: 0,
                }}
                barCategoryGap="35%"
              >
                <defs>
                  <linearGradient
                    id="dashboardBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#5868f2"
                      stopOpacity={1}
                    />
                    <stop
                      offset="100%"
                      stopColor="#7c6cf3"
                      stopOpacity={0.72}
                    />
                  </linearGradient>

                  <linearGradient
                    id="dashboardBarGradientLast"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#4658e8"
                    />
                    <stop
                      offset="100%"
                      stopColor="#7668ef"
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="#edf0f5"
                  strokeDasharray="0"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#8b94a5',
                    fontSize: 11,
                  }}
                  dy={8}
                />

                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: '#a0a7b4',
                    fontSize: 10,
                  }}
                  width={36}
                />

                <Tooltip
                  cursor={{
                    fill: 'rgba(88, 104, 242, 0.035)',
                  }}
                  formatter={(value) => [
                    `${value} đàn`,
                    'Đã bán',
                  ]}
                  contentStyle={{
                    border: '1px solid #e7eaf1',
                    borderRadius: 10,
                    boxShadow:
                      '0 10px 30px rgba(31, 39, 64, 0.08)',
                    fontSize: 12,
                  }}
                />

                <Bar
                  dataKey="count"
                  radius={[6, 6, 2, 2]}
                  maxBarSize={48}
                >
                  {data.sales_by_month.map((item, index) => (
                    <Cell
                      key={item.month}
                      fill={
                        index === data.sales_by_month.length - 1
                          ? 'url(#dashboardBarGradientLast)'
                          : 'url(#dashboardBarGradient)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* ATTENTION */}
        <article className="dashboard-panel dashboard-attention">
          <div className="dashboard-panel-heading">
            <div>
              <h2>Cần xử lý</h2>
            </div>

            <CalendarClock size={18} />
          </div>

          {attentionItems.length === 0 ? (
            <div className="dashboard-empty">
              <ShieldCheck size={22} />
              <span>Không có việc cần xử lý</span>
            </div>
          ) : (
            <div className="dashboard-attention-list">
              {attentionItems.map((item, index) => {
                const Icon = attentionIcon(item.type)

                return (
                  <button
                    type="button"
                    className="dashboard-attention-row"
                    key={`${item.type}-${index}`}
                    onClick={() =>
                      navigate(attentionRoute(item.type))
                    }
                  >
                    <span
                      className={`dashboard-attention-icon priority-${item.priority}`}
                    >
                      <Icon size={16} />
                    </span>

                    <span className="dashboard-attention-copy">
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </span>

                    <time>{fmtDate(item.due_date)}</time>
                  </button>
                )
              })}
            </div>
          )}
        </article>
      </section>

      {/* RECENT CUSTOMERS */}
      <section className="dashboard-panel dashboard-customers-panel">
        <div className="dashboard-panel-heading dashboard-customer-heading">
          <h2>Khách hàng gần đây</h2>

          <button
            type="button"
            className="dashboard-view-all"
            onClick={() => navigate('/customers')}
          >
            Xem tất cả
            <ChevronRight size={14} />
          </button>
        </div>

        {recentCustomers.length === 0 ? (
          <div className="dashboard-empty dashboard-empty-customers">
            Chưa có khách hàng
          </div>
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
                  const warranty = warrantyAppearance(
                    item.warranty_status,
                  )

                  return (
                    <tr key={item.phone}>
                      <td>
                        <div className="dashboard-customer-cell">
                          <div className="dashboard-avatar">
                            {item.name
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong className="dashboard-piano-name">
                          {item.last_piano || '—'}
                        </strong>
                      </td>

                      <td>
                        {fmtDate(item.last_purchase_date)}
                      </td>

                      <td>
                        <span
                          className={`dashboard-warranty ${warranty.className}`}
                        >
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