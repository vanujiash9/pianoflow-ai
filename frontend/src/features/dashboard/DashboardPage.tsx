import type { CSSProperties } from 'react'
import {
  AlertCircle,
  Boxes,
  CalendarClock,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '../../components/ui/PageHeader'
import { api, fmtDate } from '../../lib/api'
import type { DashboardData } from '../../types'
import { KpiCard } from './components/KpiCard'

const pageStyle: CSSProperties = {
  height: 'calc(100dvh - 84px)',
  minHeight: 0,
  overflow: 'hidden',

  display: 'grid',
  gridTemplateRows: 'auto 98px minmax(0, 1fr) 158px',
  gap: 12,
}

const kpiGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 12,
  minHeight: 0,
}

const mainGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.65fr) minmax(300px, 0.75fr)',
  gap: 12,
  minHeight: 0,
}

const fullPanelStyle: CSSProperties = {
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const panelHeaderStyle: CSSProperties = {
  padding: '14px 16px 10px',
  flexShrink: 0,
}

const tableAreaStyle: CSSProperties = {
  minHeight: 0,
  flex: 1,
  overflow: 'hidden',
}

const attentionBodyStyle: CSSProperties = {
  minHeight: 0,
  flex: 1,
  padding: '0 14px 12px',
  overflow: 'hidden',
}

const chartPanelStyle: CSSProperties = {
  minHeight: 0,
  height: '100%',
  overflow: 'hidden',
  display: 'grid',
  gridTemplateColumns: '250px minmax(0, 1fr)',
  alignItems: 'stretch',
}

const chartInfoStyle: CSSProperties = {
  padding: '16px 18px',
  borderRight: '1px solid #edf0f6',

  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}

const chartStyle: CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  padding: '8px 14px 4px 4px',
}

function getWarrantyAppearance(status?: string | null) {
  const normalized = (status || '').toLowerCase()

  if (
    normalized.includes('sắp') ||
    normalized.includes('expiring')
  ) {
    return {
      label: status || 'Sắp hết hạn',
      background: '#fff7e6',
      color: '#b45309',
      border: '#fed7aa',
    }
  }

  if (
    normalized.includes('hết') ||
    normalized.includes('expired') ||
    normalized.includes('void')
  ) {
    return {
      label: status || 'Hết hạn',
      background: '#fff1f2',
      color: '#be123c',
      border: '#fecdd3',
    }
  }

  if (
    normalized.includes('còn') ||
    normalized.includes('active')
  ) {
    return {
      label: status || 'Còn hạn',
      background: '#ecfdf3',
      color: '#15803d',
      border: '#bbf7d0',
    }
  }

  return {
    label: status || '—',
    background: '#f4f6f8',
    color: '#64748b',
    border: '#e2e8f0',
  }
}

function getPriorityColor(priority?: string) {
  switch (priority) {
    case 'high':
      return '#ef4444'
    case 'medium':
      return '#f59e0b'
    default:
      return '#64748b'
  }
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
        <PageHeader
        title="Tổng quan hôm nay"
        subtitle="Theo dõi khách hàng, đàn, bán hàng và bảo hành trong ngày."
      />

        {error ? (
          <div className="error-banner">{error}</div>
        ) : (
          <div className="loading-card">Đang tải...</div>
        )}
      </>
    )
  }

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Tổng quan hôm nay"
        subtitle="Theo dõi khách hàng, đàn, bán hàng và bảo hành trong ngày."
      />

      {/* KPI */}
      <section style={kpiGridStyle}>
        <KpiCard
          label="Đàn"
          value={data.kpis.available_pianos}
          helper="Có thể tư vấn ngay"
          icon={Boxes}
          tone="blue"
          onClick={() => navigate('/pianos')}
        />

        <KpiCard
          label="Đã bán tháng này"
          value={data.kpis.sold_this_month}
          helper="Đơn bán mới trong tháng"
          icon={ShoppingBag}
          tone="green"
          onClick={() => navigate('/sales')}
        />

        <KpiCard
          label="Khách"
          value={data.kpis.total_customers}
          helper="Đã lưu hồ sơ"          icon={Users}
          tone="violet"
          onClick={() => navigate('/customers')}
        />

        <KpiCard
          label="Cần xử lý"
          value={data.kpis.action_items}
          helper="Không có việc cần làm hôm nay"
          icon={AlertCircle}
          tone="amber"
        />
      </section>

      {/* MAIN AREA */}
      <section style={mainGridStyle}>
        <div className="panel" style={fullPanelStyle}>
          <div
            className="panel-header"
            style={panelHeaderStyle}
          >
            <div>
              <h3>Khách & bảo hành</h3>
            </div>
          </div>

          <div style={tableAreaStyle}>
            {recentCustomers.length === 0 ? (
              <div className="dashboard-empty-state">
                Chưa có khách gần đây
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  tableLayout: 'fixed',
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: '27%' }}>
                      Khách hàng
                    </th>
                    <th style={{ width: '27%' }}>
                      Đàn gần nhất
                    </th>
                    <th style={{ width: '17%' }}>
                      Ngày mua
                    </th>
                    <th style={{ width: '17%' }}>
                      Bảo hành
                    </th>
                    <th style={{ width: '12%' }} />
                  </tr>
                </thead>

                <tbody>
                  {recentCustomers.map((item) => {
                    const warranty = getWarrantyAppearance(
                      item.warranty_status,
                    )

                    return (
                      <tr key={item.phone}>
                        <td>
                          <strong>{item.name}</strong>
                          <div className="subtext">
                            {item.phone}
                          </div>
                        </td>

                        <td>
                          {item.last_piano || '—'}
                        </td>

                        <td>
                          {fmtDate(item.last_purchase_date)}
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',

                              padding: '4px 9px',
                              borderRadius: 999,

                              border: `1px solid ${warranty.border}`,
                              background: warranty.background,
                              color: warranty.color,

                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {warranty.label}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() =>
                              navigate('/warranties')
                            }
                            style={{
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            Tra cứu
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ATTENTION */}
        <div
          className="panel attention-panel"
          style={fullPanelStyle}
        >
          <div
            className="panel-header"
            style={panelHeaderStyle}
          >
            <div>
              <h3>Cần xử lý</h3>
            </div>

            <CalendarClock size={19} />
          </div>

          <div style={attentionBodyStyle}>
            {attentionItems.length === 0 ? (
              <div />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {attentionItems.map((item, index) => (
                  <div
                    key={`${item.type}-${index}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        '8px minmax(0, 1fr) auto',
                      gap: 10,
                      alignItems: 'center',

                      flex: '1 1 0',

                      borderBottom:
                        index < attentionItems.length - 1
                          ? '1px solid #edf0f5'
                          : undefined,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: getPriorityColor(
                          item.priority,
                        ),
                      }}
                    />

                    <div
                      style={{
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      <strong style={{ fontSize: 13 }}>
                        {item.title}
                      </strong>
                    </div>

                    <time>{fmtDate(item.due_date)}</time>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* COMPACT SALES CHART */}
      <section
        className="panel"
        style={chartPanelStyle}
      >
        <div style={chartInfoStyle}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 5,
            }}
          >
            <ShoppingBag size={17} />
            <h3 style={{ margin: 0 }}>Nhịp bán</h3>
          </div>
        </div>

        <div style={chartStyle}>
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={data.sales_by_month}
              margin={{
                top: 8,
                right: 12,
                left: -22,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="dashboardSalesFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#5b6df8"
                    stopOpacity={0.24}
                  />
                  <stop
                    offset="95%"
                    stopColor="#5b6df8"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#edf0f6"
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />

              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={34}
              />

              <Tooltip
                cursor={{
                  stroke: '#cbd3ff',
                  strokeDasharray: '3 3',
                }}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #e6eaf2',
                  boxShadow:
                    '0 8px 24px rgba(15, 23, 42, 0.08)',
                  fontSize: 12,
                }}
              />

              <Area
                type="monotone"
                dataKey="count"
                stroke="#5b6df8"
                fill="url(#dashboardSalesFill)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}