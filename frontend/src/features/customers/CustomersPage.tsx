import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  ListFilter,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useSearchParams } from 'react-router-dom'

import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { api, fmtDate } from '../../lib/api'
import type {
  Customer,
  CustomerProfile,
} from '../../types'

import './customers.css'

const emptyForm = {
  name: '',
  phone: '',
  address: '',
  notes: '',
}

type CustomerFilter =
  | 'all'
  | 'warranty'
  | 'purchased'

type CustomerRow = {
  customer: Customer
  profile: CustomerProfile | null
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return '?'

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getLatestPurchase(
  profile: CustomerProfile | null,
) {
  if (!profile || profile.purchases.length === 0) {
    return null
  }

  return [...profile.purchases].sort(
    (a, b) =>
      new Date(b.sale_date).getTime() -
      new Date(a.sale_date).getTime(),
  )[0]
}

export function CustomersPage() {
  const [params, setParams] = useSearchParams()

  const initialSearch = params.get('search') || ''

  const [search, setSearch] =
    useState(initialSearch)

  const [items, setItems] = useState<Customer[]>([])
  const [rows, setRows] = useState<CustomerRow[]>([])

  const [filter, setFilter] =
    useState<CustomerFilter>('all')

  const [open, setOpen] = useState(false)

  const [profile, setProfile] =
    useState<CustomerProfile | null>(null)

  const [profileLoading, setProfileLoading] =
    useState(false)

  const [listLoading, setListLoading] =
    useState(false)

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  const loadProfiles = async (
    customers: Customer[],
  ) => {
    const profileRows = await Promise.all(
      customers.map(async (customer) => {
        try {
          const customerProfile =
            await api<CustomerProfile>(
              `/customers/${customer.id}/profile`,
            )

          return {
            customer,
            profile: customerProfile,
          }
        } catch {
          return {
            customer,
            profile: null,
          }
        }
      }),
    )

    setRows(profileRows)
  }

  const load = async (q = search) => {
    try {
      setError('')
      setListLoading(true)

      const normalized = q.trim()

      const query = normalized
        ? `?search=${encodeURIComponent(normalized)}`
        : ''

      const customers = await api<Customer[]>(
        `/customers${query}`,
      )

      setItems(customers)

      await loadProfiles(customers)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void load(initialSearch)
  }, [])

  const filteredRows = useMemo(() => {
    if (filter === 'all') {
      return rows
    }

    if (filter === 'purchased') {
      return rows.filter(
        (row) =>
          row.profile &&
          row.profile.purchases.length > 0,
      )
    }

    return rows.filter((row) => {
      const purchase = getLatestPurchase(
        row.profile,
      )

      return Boolean(purchase?.warranty_status)
    })
  }, [rows, filter])

  const submitSearch = (
    event: FormEvent,
  ) => {
    event.preventDefault()

    const normalized = search.trim()

    setParams(
      normalized
        ? {
            search: normalized,
          }
        : {},
    )

    void load(normalized)
  }

  const create = async (
    event: FormEvent,
  ) => {
    event.preventDefault()

    try {
      setError('')

      await api<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),

          phone: form.phone
            .trim()
            .replace(/[\s\-()]/g, ''),

          address:
            form.address.trim() || null,

          notes:
            form.notes.trim() || null,
        }),
      })

      setForm(emptyForm)
      setOpen(false)

      setSearch('')
      setParams({})

      await load('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const openProfile = async (
    customerId: string,
  ) => {
    setProfileLoading(true)
    setProfile(null)

    try {
      setProfile(
        await api<CustomerProfile>(
          `/customers/${customerId}/profile`,
        ),
      )
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setProfileLoading(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Khách hàng"
        subtitle="Quản lý hồ sơ khách, lịch sử mua đàn và trạng thái bảo hành."
        actions={
          <button
            type="button"
            className="primary-button"
            onClick={() => setOpen(true)}
          >
            <Plus size={17} />
            Thêm khách
          </button>
        }
      />

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* SEARCH + FILTER */}
      <section className="panel customers-toolbar">
        <form
          className="customers-search"
          onSubmit={submitSearch}
        >
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Tìm theo tên hoặc số điện thoại..."
          />

          {search.trim() && (
            <button
              type="submit"
              className="customers-search-submit"
            >
              Tìm
            </button>
          )}
        </form>

        <div className="customer-filter-tabs">
          <button
            type="button"
            className={
              filter === 'all'
                ? 'active'
                : ''
            }
            onClick={() => setFilter('all')}
          >
            <ListFilter size={15} />
            Tất cả
          </button>

          <button
            type="button"
            className={
              filter === 'warranty'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter('warranty')
            }
          >
            <ShieldCheck size={15} />
            Có bảo hành
          </button>

          <button
            type="button"
            className={
              filter === 'purchased'
                ? 'active'
                : ''
            }
            onClick={() =>
              setFilter('purchased')
            }
          >
            <Clock3 size={15} />
            Đã mua đàn
          </button>
        </div>

        <div className="customers-total">
          {filteredRows.length} khách
        </div>
      </section>

      {/* TABLE */}
      <section className="panel customers-table-card">
        {listLoading ? (
          <div className="customers-loading">
            Đang tải khách hàng...
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="customers-loading">
            <strong>Chưa có khách phù hợp</strong>
            <span>Thử thay đổi từ khóa hoặc bộ lọc.</span>
          </div>
        ) : (
          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Đàn gần nhất</th>
                  <th>Bảo hành</th>
                  <th>Ngày mua gần nhất</th>
                  <th>Ghi chú</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row) => {
                  const item = row.customer

                  const latestPurchase =
                    getLatestPurchase(row.profile)

                  return (
                    <tr
                      key={item.id}
                      className="customer-row"
                      onClick={() =>
                        void openProfile(
                          item.id,
                        )
                      }
                    >
                      <td>
                        <div className="customer-name-cell">
                          <div className="customer-avatar">
                            {getInitials(
                              item.name,
                            )}
                          </div>

                          <div>
                            <strong>
                              {item.name}
                            </strong>

                            {item.address && (
                              <span>
                                {item.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="customer-phone">
                        {item.phone}
                      </td>

                      <td>
                        {latestPurchase ? (
                          <div className="customer-piano">
                            <strong>
                              {
                                latestPurchase.piano_name
                              }
                            </strong>

                            <span>
                              SN:{' '}
                              {latestPurchase.serial_number ||
                                '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="customer-empty-value">
                            Chưa mua đàn
                          </span>
                        )}
                      </td>

                      <td>
                        {latestPurchase
                          ?.warranty_status ? (
                          <StatusBadge
                            value={
                              latestPurchase.warranty_status
                            }
                          />
                        ) : (
                          <span className="customer-empty-value">
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        {latestPurchase
                          ? fmtDate(
                              latestPurchase.sale_date,
                            )
                          : '—'}
                      </td>

                      <td>
                        <span className="customer-note">
                          {item.notes || '—'}
                        </span>
                      </td>

                      <td>
                        <ChevronRight
                          className="customer-row-arrow"
                          size={16}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <footer className="customers-table-footer">
              <span>
                Hiển thị{' '}
                <strong>
                  {filteredRows.length}
                </strong>{' '}
                khách hàng
              </span>

              <span>
                Dữ liệu cập nhật từ hệ thống
              </span>
            </footer>
          </div>
        )}
      </section>

      {/* CREATE CUSTOMER */}
      <Modal
        open={open}
        title="Thêm khách hàng"
        onClose={() => setOpen(false)}
      >
        <form
          className="form-grid"
          onSubmit={create}
        >
          <label>
            Họ tên

            <input
              required
              value={form.name}
              placeholder="Ví dụ: Anh Minh"
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
            />
          </label>

          <label>
            Số điện thoại

            <input
              required
              value={form.phone}
              placeholder="0907 111 222"
              onChange={(event) =>
                setForm({
                  ...form,
                  phone: event.target.value,
                })
              }
            />
          </label>

          <label className="span-2">
            Địa chỉ

            <input
              value={form.address}
              placeholder="Địa chỉ khách hàng"
              onChange={(event) =>
                setForm({
                  ...form,
                  address:
                    event.target.value,
                })
              }
            />
          </label>

          <label className="span-2">
            Ghi chú

            <textarea
              rows={3}
              value={form.notes}
              placeholder="Thông tin cần lưu ý..."
              onChange={(event) =>
                setForm({
                  ...form,
                  notes:
                    event.target.value,
                })
              }
            />
          </label>

          <div className="form-actions span-2">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setOpen(false)
              }
            >
              Hủy
            </button>

            <button className="primary-button">
              Lưu khách hàng
            </button>
          </div>
        </form>
      </Modal>

      {/* CUSTOMER PROFILE */}
      <Modal
        open={
          profileLoading ||
          Boolean(profile)
        }
        title="Hồ sơ khách hàng"
        onClose={() => {
          setProfile(null)
          setProfileLoading(false)
        }}
      >
        {profileLoading && (
          <div className="loading-card">
            Đang tải...
          </div>
        )}

        {profile && (
          <div className="customer-profile">
            <div className="profile-hero">
              <div className="profile-avatar">
                {getInitials(
                  profile.customer.name,
                )}
              </div>

              <div className="profile-hero-content">
                <h3>
                  {profile.customer.name}
                </h3>

                <p>
                  {profile.customer.phone}

                  <span>•</span>

                  {profile.customer
                    .address ||
                    'Chưa có địa chỉ'}
                </p>

                {profile.customer.notes && (
                  <div className="profile-note">
                    {profile.customer.notes}
                  </div>
                )}
              </div>
            </div>

            <section className="profile-section">
              <div className="section-title">
                <div>
                  <h4>Đàn đã mua</h4>

                  <p>
                    Lịch sử đàn và bảo hành
                    của khách.
                  </p>
                </div>

                <span>
                  {
                    profile.purchases
                      .length
                  }{' '}
                  cây
                </span>
              </div>

              {profile.purchases
                .length === 0 ? (
                <div className="profile-empty">
                  Chưa có lịch sử mua
                </div>
              ) : (
                <div className="profile-list">
                  {profile.purchases.map(
                    (item) => (
                      <div
                        className="profile-item"
                        key={
                          item.piano_id
                        }
                      >
                        <div className="profile-item-icon">
                          <CheckCircle2
                            size={17}
                          />
                        </div>

                        <div className="profile-item-main">
                          <strong>
                            {
                              item.piano_name
                            }
                          </strong>

                          <span className="mono">
                            {item.serial_number ||
                              'Không có serial'}
                          </span>
                        </div>

                        <div className="profile-item-date">
                          <span>
                            Mua{' '}
                            {fmtDate(
                              item.sale_date,
                            )}
                          </span>

                          <span>
                            BH đến{' '}
                            {fmtDate(
                              item.warranty_end_date,
                            )}
                          </span>
                        </div>

                        {item.warranty_status && (
                          <StatusBadge
                            value={
                              item.warranty_status
                            }
                          />
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

            <section className="profile-section">
              <div className="section-title">
                <div>
                  <h4>
                    Bảo trì / sửa chữa
                  </h4>

                  <p>
                    Lịch sử chăm sóc đàn.
                  </p>
                </div>

                <span>
                  {profile.services.length}{' '}
                  lần
                </span>
              </div>

              {profile.services.length ===
              0 ? (
                <div className="profile-empty">
                  Chưa có lịch sử bảo trì.
                </div>
              ) : (
                <div className="profile-list">
                  {profile.services.map(
                    (item, index) => (
                      <div
                        className="profile-item"
                        key={`${item.piano_name}-${item.service_date}-${index}`}
                      >
                        <div className="profile-item-icon service">
                          <UserRound
                            size={17}
                          />
                        </div>

                        <div className="profile-item-main">
                          <strong>
                            {
                              item.service_type
                            }
                          </strong>

                          <span>
                            {item.piano_name}
                          </span>
                        </div>

                        <div className="profile-item-date">
                          <span>
                            {fmtDate(
                              item.service_date,
                            )}
                          </span>

                          <span>
                            Lần tới{' '}
                            {fmtDate(
                              item.next_service_date,
                            )}
                          </span>
                        </div>

                        <StatusBadge
                          value={
                            item.status
                          }
                        />
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </Modal>
    </>
  )
}