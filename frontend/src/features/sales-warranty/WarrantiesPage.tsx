import {
  CalendarClock,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { api, fmtDate } from '../../lib/api'
import type { Warranty } from '../../types'

import './warranties-print.css'

type WarrantyFilter =
  | 'all'
  | 'active'
  | 'expiring'
  | 'expired'

export function WarrantiesPage() {
  const [items, setItems] = useState<Warranty[]>([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] =
    useState<WarrantyFilter>('all')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setLoading(true)
        setError('')

        const result =
          await api<Warranty[]>('/warranties')

        if (mounted) {
          setItems(result)
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Không thể tải danh sách bảo hành.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [])

  const activeCount = useMemo(
    () =>
      items.filter(
        (item) => item.status === 'active',
      ).length,
    [items],
  )

  const expiringCount = useMemo(
    () =>
      items.filter(
        (item) => item.status === 'expiring',
      ).length,
    [items],
  )

  const filteredItems = useMemo(() => {
    const keyword = query
      .trim()
      .toLowerCase()

    return items.filter((item) => {
      if (
        filter !== 'all' &&
        item.status !== filter
      ) {
        return false
      }

      if (!keyword) {
        return true
      }

      const searchable = [
        item.customer_name,
        item.customer_phone,
        item.piano_name,
        item.serial_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(keyword)
    })
  }, [items, query, filter])

  return (
    <div className="warranty-list-page">
      <PageHeader
        title="Bảo hành"
        subtitle="Theo dõi thời hạn bảo hành của khách hàng."
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              navigate('/warranties/print')
            }
          >
            <Plus size={17} />
            Tạo phiếu
          </button>
        }
      />

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="warranty-overview">
        <div className="warranty-overview-item">
          <span className="warranty-overview-icon is-active">
            <ShieldCheck size={18} />
          </span>

          <div>
            <strong>{activeCount}</strong>
            <span>Còn bảo hành</span>
          </div>
        </div>

        <div className="warranty-overview-divider" />

        <div className="warranty-overview-item">
          <span className="warranty-overview-icon is-expiring">
            <CalendarClock size={18} />
          </span>

          <div>
            <strong>{expiringCount}</strong>
            <span>Sắp hết hạn</span>
          </div>
        </div>

        <div className="warranty-overview-total">
          {items.length} phiếu
        </div>
      </div>

      <section className="panel warranty-list-panel">
        <div className="warranty-list-toolbar">
          <div className="warranty-list-search">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Tìm khách hàng, SĐT, đàn hoặc serial"
            />
          </div>

          <div className="warranty-filter">
            <button
              type="button"
              className={
                filter === 'all'
                  ? 'selected'
                  : ''
              }
              onClick={() => setFilter('all')}
            >
              Tất cả
            </button>

            <button
              type="button"
              className={
                filter === 'active'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                setFilter('active')
              }
            >
              Còn hạn
            </button>

            <button
              type="button"
              className={
                filter === 'expiring'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                setFilter('expiring')
              }
            >
              Sắp hết
            </button>

            <button
              type="button"
              className={
                filter === 'expired'
                  ? 'selected'
                  : ''
              }
              onClick={() =>
                setFilter('expired')
              }
            >
              Hết hạn
            </button>
          </div>

          <span className="warranty-list-count">
            {filteredItems.length} kết quả
          </span>
        </div>

        {loading ? (
          <div className="warranty-list-state">
            Đang tải dữ liệu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="warranty-list-state">
            <strong>{items.length === 0 ? 'Chưa có bảo hành' : 'Không tìm thấy kết quả'}</strong>
            <span>{items.length === 0 ? 'Bảo hành sẽ xuất hiện sau khi ghi nhận bán đàn.' : 'Thử thay đổi từ khóa hoặc bộ lọc.'}</span>
          </div>
        ) : (
          <>
            <div className="warranty-table-scroll">
              <table className="warranty-list-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Đàn</th>
                    <th>Serial</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="warranty-person">
                          <div className="warranty-person-avatar">
                            {item.customer_name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || 'K'}
                          </div>

                          <div>
                            <strong>
                              {item.customer_name}
                            </strong>

                            <span>
                              {item.customer_phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="warranty-piano">
                          {item.piano_name}
                        </span>
                      </td>

                      <td>
                        <span className="warranty-serial">
                          {item.serial_number ||
                            '—'}
                        </span>
                      </td>

                      <td>
                        {fmtDate(
                          item.start_date,
                        )}
                      </td>

                      <td>
                        {fmtDate(item.end_date)}
                      </td>

                      <td>
                        <StatusBadge
                          value={item.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="warranty-mobile-list">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="warranty-mobile-card"
                >
                  <div className="warranty-mobile-header">
                    <div className="warranty-person">
                      <div className="warranty-person-avatar">
                        {item.customer_name
                          ?.trim()
                          .charAt(0)
                          .toUpperCase() || 'K'}
                      </div>

                      <div>
                        <strong>
                          {item.customer_name}
                        </strong>

                        <span>
                          {item.customer_phone}
                        </span>
                      </div>
                    </div>

                    <StatusBadge
                      value={item.status}
                    />
                  </div>

                  <div className="warranty-mobile-product">
                    <strong>
                      {item.piano_name}
                    </strong>

                    <span>
                      Serial:{' '}
                      {item.serial_number || '—'}
                    </span>
                  </div>

                  <div className="warranty-mobile-dates">
                    <div>
                      <span>Bắt đầu</span>
                      <strong>
                        {fmtDate(
                          item.start_date,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Kết thúc</span>
                      <strong>
                        {fmtDate(
                          item.end_date,
                        )}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
