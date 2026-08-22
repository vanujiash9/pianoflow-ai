import { CalendarDays, CheckCircle2, CircleX, Plus, Search, Wrench } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Drawer } from '../../../components/ui/Drawer'
import { PageHeader } from '../../../components/ui/PageHeader'
import { api, fmtDate } from '../../../lib/api'
import type { Customer, Piano, Sale, ServiceRecord, ServiceStatus } from '../../../types'

import './services.css'

type ServiceFilter =
  | 'all'
  | 'scheduled'
  | 'completed'
  | 'cancelled'

type ServiceForm = {
  customer_id: string
  piano_id: string
  service_date: string
  service_type: string
  description: string
  next_service_date: string
  status: ServiceStatus
  notes: string
}

function getToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 10)
}

function createInitialForm(): ServiceForm {
  return {
    customer_id: '',
    piano_id: '',
    service_date: getToday(),
    service_type: 'Bảo trì định kỳ',
    description: '',
    next_service_date: '',
    status: 'scheduled',
    notes: '',
  }
}

function statusLabel(status: ServiceStatus) {
  switch (status) {
    case 'scheduled':
      return 'Đã hẹn'
    case 'completed':
      return 'Hoàn tất'
    case 'cancelled':
      return 'Đã hủy'
    case 'in_progress':
      return 'Đang xử lý'
    default:
      return status
  }
}

export function ServicesPage() {
  const [items, setItems] =
    useState<ServiceRecord[]>([])

  const [customers, setCustomers] =
    useState<Customer[]>([])

  const [pianos, setPianos] =
    useState<Piano[]>([])

  const [sales, setSales] =
    useState<Sale[]>([])

  const [open, setOpen] = useState(false)
  const [loading, setLoading] =
    useState(true)
  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [query, setQuery] =
    useState('')

  const [filter, setFilter] =
    useState<ServiceFilter>('all')

  const [serviceTypeFilter, setServiceTypeFilter] =
    useState('all')

  const [form, setForm] =
    useState<ServiceForm>(
      createInitialForm,
    )

  const load = async () => {
    try {
      setLoading(true)
      setError('')

      const [
        serviceRows,
        customerRows,
        pianoRows,
        saleRows,
      ] = await Promise.all([
        api<ServiceRecord[]>('/services'),
        api<Customer[]>('/customers'),
        api<Piano[]>('/pianos?status=sold'),
        api<Sale[]>('/sales'),
      ])

      setItems(serviceRows)
      setCustomers(customerRows)
      setPianos(pianoRows)
      setSales(saleRows)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu bảo trì.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const customerPianos = useMemo(() => {
    const pianoIds = new Set(
      sales
        .filter(
          (sale) =>
            sale.customer_id ===
            form.customer_id,
        )
        .map((sale) => sale.piano_id),
    )

    return pianos.filter((piano) =>
      pianoIds.has(piano.id),
    )
  }, [
    form.customer_id,
    pianos,
    sales,
  ])

  const counts = useMemo(
    () => ({
      total: items.length,

      scheduled: items.filter(
        (item) =>
          item.status === 'scheduled',
      ).length,

      completed: items.filter(
        (item) =>
          item.status === 'completed',
      ).length,

      cancelled: items.filter(
        (item) =>
          item.status === 'cancelled',
      ).length,
    }),
    [items],
  )

  const serviceTypes = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .map((item) =>
              item.service_type?.trim(),
            )
            .filter(Boolean),
        ),
      ),
    [items],
  )

  const filteredItems = useMemo(() => {
    const keyword = query
      .trim()
      .toLowerCase()

    return items.filter((item) => {
      const matchesStatus =
        filter === 'all' ||
        item.status === filter

      const matchesType =
        serviceTypeFilter === 'all' ||
        item.service_type ===
          serviceTypeFilter

      const searchableText = [
        item.customer_name,
        item.customer_phone,
        item.piano_name,
        item.serial_number,
        item.service_type,
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !keyword ||
        searchableText.includes(keyword)

      return (
        matchesStatus &&
        matchesType &&
        matchesSearch
      )
    })
  }, [
    items,
    query,
    filter,
    serviceTypeFilter,
  ])

  const updateStatus = async (
    id: string,
    status: ServiceStatus,
  ) => {
    try {
      setError('')

      await api(`/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
        }),
      })

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể cập nhật trạng thái.',
      )
    }
  }

  const openCreateModal = () => {
    setForm(createInitialForm())
    setError('')
    setOpen(true)
  }

  const create = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    if (saving) return

    try {
      setSaving(true)
      setError('')

      await api('/services', {
        method: 'POST',

        body: JSON.stringify({
          ...form,

          description:
            form.description.trim() ||
            null,

          next_service_date:
            form.next_service_date ||
            null,

          notes:
            form.notes.trim() ||
            null,
        }),
      })

      setOpen(false)
      setForm(createInitialForm())

      await load()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tạo lịch bảo trì.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="services-page">
      <PageHeader
        title="Bảo trì & sửa chữa"
        subtitle=""
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Thêm lịch
          </button>
        }
      />

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* SUMMARY */}
      <section className="service-summary">
        <button
          type="button"
          className={
            filter === 'all'
              ? 'service-summary-item selected'
              : 'service-summary-item'
          }
          onClick={() =>
            setFilter('all')
          }
        >
          <span className="service-summary-icon">
            <CalendarDays size={18} />
          </span>

          <div>
            <strong>{counts.total}</strong>
            <span>Tổng lịch</span>
          </div>
        </button>

        <div className="service-summary-divider" />

        <button
          type="button"
          className={
            filter === 'scheduled'
              ? 'service-summary-item selected'
              : 'service-summary-item'
          }
          onClick={() =>
            setFilter('scheduled')
          }
        >
          <span className="service-summary-icon scheduled">
            <CalendarDays size={18} />
          </span>

          <div>
            <strong>
              {counts.scheduled}
            </strong>
            <span>Đã hẹn</span>
          </div>
        </button>

        <div className="service-summary-divider" />

        <button
          type="button"
          className={
            filter === 'completed'
              ? 'service-summary-item selected'
              : 'service-summary-item'
          }
          onClick={() =>
            setFilter('completed')
          }
        >
          <span className="service-summary-icon completed">
            <CheckCircle2 size={18} />
          </span>

          <div>
            <strong>
              {counts.completed}
            </strong>
            <span>Hoàn tất</span>
          </div>
        </button>

        <div className="service-summary-divider" />

        <button
          type="button"
          className={
            filter === 'cancelled'
              ? 'service-summary-item selected'
              : 'service-summary-item'
          }
          onClick={() =>
            setFilter('cancelled')
          }
        >
          <span className="service-summary-icon cancelled">
            <CircleX size={18} />
          </span>

          <div>
            <strong>
              {counts.cancelled}
            </strong>
            <span>Đã hủy</span>
          </div>
        </button>
      </section>

      {/* LIST */}
      <section className="panel service-panel">
        <div className="service-toolbar">
          <div className="service-search">
            <Search size={16} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Tìm khách, đàn, serial hoặc nội dung..."
            />
          </div>

          <select
            className="service-filter-select"
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target
                  .value as ServiceFilter,
              )
            }
          >
            <option value="all">
              Tất cả trạng thái
            </option>

            <option value="scheduled">
              Đã hẹn
            </option>

            <option value="completed">
              Hoàn tất
            </option>

            <option value="cancelled">
              Đã hủy
            </option>
          </select>

          <select
            className="service-filter-select"
            value={serviceTypeFilter}
            onChange={(event) =>
              setServiceTypeFilter(
                event.target.value,
              )
            }
          >
            <option value="all">
              Tất cả công việc
            </option>

            {serviceTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ),
            )}
          </select>

          <span className="service-result-count">
            {filteredItems.length} kết quả
          </span>
        </div>

        {loading ? (
          <div className="service-state">
            Đang tải dữ liệu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="service-state">
            <strong>{items.length === 0 ? 'Chưa có lịch bảo trì' : 'Không tìm thấy kết quả'}</strong>
            <span>{items.length === 0 ? 'Tạo lịch sau bán để theo dõi việc chăm sóc và sửa chữa đàn.' : 'Thử thay đổi từ khóa hoặc bộ lọc.'}</span>
          </div>
        ) : (
          <>
            <div className="service-table-scroll">
              <table className="service-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Đàn / Serial</th>
                    <th>Công việc</th>
                    <th>Ngày hẹn</th>
                    <th>Lịch tiếp theo</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map(
                    (item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="service-customer">
                            <div className="service-avatar">
                              {item.customer_name
                                ?.trim()
                                .charAt(0)
                                .toUpperCase() ||
                                'K'}
                            </div>

                            <div>
                              <strong>
                                {
                                  item.customer_name
                                }
                              </strong>

                              <span>
                                {
                                  item.customer_phone
                                }
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="service-piano">
                            <strong>
                              {
                                item.piano_name
                              }
                            </strong>

                            <span>
                              {item.serial_number ||
                                '—'}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="service-work">
                            <strong>
                              {
                                item.service_type
                              }
                            </strong>

                            {item.description && (
                              <span>
                                {
                                  item.description
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className="service-date">
                            {fmtDate(
                              item.service_date,
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="service-date">
                            {item.next_service_date
                              ? fmtDate(
                                  item.next_service_date,
                                )
                              : '—'}
                          </span>
                        </td>

                        <td>
                          <select
                            className={`service-status-select status-${item.status}`}
                            value={
                              item.status
                            }
                            onChange={(
                              event,
                            ) =>
                              void updateStatus(
                                item.id,
                                event
                                  .target
                                  .value as ServiceStatus,
                              )
                            }
                          >
                            {/* legacy only */}
                            {item.status ===
                              'in_progress' && (
                              <option
                                value="in_progress"
                                disabled
                              >
                                Đang xử lý
                              </option>
                            )}

                            <option value="scheduled">
                              Đã hẹn
                            </option>

                            <option value="completed">
                              Hoàn tất
                            </option>

                            <option value="cancelled">
                              Đã hủy
                            </option>
                          </select>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="service-mobile-list">
              {filteredItems.map(
                (item) => (
                  <article
                    key={item.id}
                    className="service-mobile-card"
                  >
                    <div className="service-mobile-top">
                      <div className="service-customer">
                        <div className="service-avatar">
                          {item.customer_name
                            ?.trim()
                            .charAt(0)
                            .toUpperCase() ||
                            'K'}
                        </div>

                        <div>
                          <strong>
                            {
                              item.customer_name
                            }
                          </strong>

                          <span>
                            {
                              item.customer_phone
                            }
                          </span>
                        </div>
                      </div>

                      <span
                        className={`service-mobile-status status-${item.status}`}
                      >
                        {statusLabel(
                          item.status,
                        )}
                      </span>
                    </div>

                    <div className="service-mobile-piano">
                      <strong>
                        {item.piano_name}
                      </strong>

                      <span>
                        Serial:{' '}
                        {item.serial_number ||
                          '—'}
                      </span>
                    </div>

                    <div className="service-mobile-meta">
                      <div>
                        <span>
                          Công việc
                        </span>
                        <strong>
                          {
                            item.service_type
                          }
                        </strong>
                      </div>

                      <div>
                        <span>Ngày hẹn</span>
                        <strong>
                          {fmtDate(
                            item.service_date,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Lịch tiếp theo
                        </span>
                        <strong>
                          {item.next_service_date
                            ? fmtDate(
                                item.next_service_date,
                              )
                            : '—'}
                        </strong>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          </>
        )}
      </section>

      <Drawer open={open} title="Thêm lịch bảo trì" onClose={() => { if (!saving) setOpen(false) }}>
        <form className="service-form" onSubmit={create}>
          <div className="service-form-grid">
            <label>
              <span>Khách hàng</span>
              <select required value={form.customer_id} onChange={(event) => setForm({ ...form, customer_id: event.target.value, piano_id: '' })}>
                <option value="">Chọn khách</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</option>)}
              </select>
            </label>
            <label>
              <span>Đàn khách đã mua</span>
              <select required disabled={!form.customer_id} value={form.piano_id} onChange={(event) => setForm({ ...form, piano_id: event.target.value })}>
                <option value="">{form.customer_id ? 'Chọn đàn' : 'Chọn khách trước'}</option>
                {customerPianos.map((piano) => <option key={piano.id} value={piano.id}>{piano.brand} {piano.model}{piano.serial_number ? ` · ${piano.serial_number}` : ''}</option>)}
              </select>
            </label>
            <label>
              <span>Ngày bảo trì</span>
              <input type="date" required value={form.service_date} onChange={(event) => setForm({ ...form, service_date: event.target.value })} />
            </label>
            <label>
              <span>Loại công việc</span>
              <select required value={form.service_type} onChange={(event) => setForm({ ...form, service_type: event.target.value })}>
                <option value="Bảo trì định kỳ">Bảo trì định kỳ</option>
                <option value="Lên dây">Lên dây</option>
                <option value="Sửa chữa">Sửa chữa</option>
                <option value="Kiểm tra">Kiểm tra</option>
                <option value="Vệ sinh">Vệ sinh</option>
              </select>
            </label>
            <label className="span-2">
              <span>Mô tả công việc</span>
              <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Ví dụ: Lên dây, vệ sinh tổng thể, kiểm tra pedal..." />
            </label>
            <label>
              <span>Lịch tiếp theo</span>
              <input type="date" value={form.next_service_date} onChange={(event) => setForm({ ...form, next_service_date: event.target.value })} />
            </label>
            <label>
              <span>Trạng thái</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ServiceStatus })}>
                <option value="scheduled">Đã hẹn</option>
                <option value="completed">Hoàn tất</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </label>
            <label className="span-2">
              <span>Ghi chú nội bộ</span>
              <textarea rows={2} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Thông tin thêm nếu cần..." />
            </label>
          </div>
          <div className="service-form-actions">
            <button type="button" className="secondary-button" disabled={saving} onClick={() => setOpen(false)}>Hủy</button>
            <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu lịch'}</button>
          </div>
        </form>
      </Drawer>
    </div>
  )
}