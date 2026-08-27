import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ListFilter,
  MapPin,
  Piano as PianoIcon,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Wrench,
} from 'lucide-react'
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'

import { PageHeader } from '../../components/ui/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import {
  api,
  fmtDate,
  getCachedResponse,
} from '../../lib/api'
import type {
  Customer,
  CustomerProfile,
} from '../../types'

import './customers.css'

type CustomerFilter = 'all' | 'warranty' | 'purchased' | 'maintenance'

type CustomerFilterLabel = Record<CustomerFilter, string>

const customerFilterLabels: CustomerFilterLabel = {
  all: 'Tổng hợp hồ sơ',
  warranty: 'Bảo hành còn hiệu lực',
  purchased: 'Đã có giao dịch',
  maintenance: 'Đã có bảo trì',
}

type CustomerRow = {
  customer: Customer
  profile: CustomerProfile | null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function getLatestPurchase(profile: CustomerProfile | null) {
  if (!profile || profile.purchases.length === 0) return null

  return [...profile.purchases].sort(
    (a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
  )[0]
}

function isActiveWarranty(status?: string | null) {
  if (!status) return false

  const normalized = status.toLowerCase()
  return (
    normalized.includes('active') ||
    normalized.includes('expiring') ||
    normalized.includes('còn') ||
    normalized.includes('sắp')
  )
}

interface CustomerDetailProps {
  customer: Customer
  profile: CustomerProfile | null
  loading: boolean
  error: string
  onBack: () => void
}

function CustomerDetail({
  customer,
  profile,
  loading,
  error,
  onBack,
}: CustomerDetailProps) {
  const purchases = profile?.purchases ?? []
  const services = profile?.services ?? []

  const activeWarrantyCount = purchases.filter((item) => isActiveWarranty(item.warranty_status)).length

  return (
    <div className="customer-detail-page">
      <div className="customer-detail-header">
        <div>
          <button type="button" className="customer-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            Quay lại danh sách
          </button>

          <h1>Chi tiết khách hàng</h1>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section className="customer-detail-hero">
        <div className="customer-detail-person">
          <div className="customer-detail-avatar">{getInitials(customer.name)}</div>

          <div className="customer-detail-person-copy">
            <div className="customer-detail-name-row">
              <h2>{customer.name}</h2>
              <span className="customer-type-badge">Khách hàng</span>
            </div>

            <div className="customer-detail-contact">
              <span>
                <Phone size={14} />
                {customer.phone}
              </span>
              <span>
                <MapPin size={14} />
                {customer.address || 'Chưa có địa chỉ'}
              </span>
            </div>

            {customer.notes && <div className="customer-detail-note">{customer.notes}</div>}
          </div>
        </div>

        <div className="customer-detail-stats">
          <div className="customer-stat-card">
            <span className="customer-stat-icon blue"><ShoppingBag size={19} /></span>
            <div>
              <span>Đã mua đàn</span>
              <strong>{purchases.length}</strong>
            </div>
          </div>

          <div className="customer-stat-card">
            <span className="customer-stat-icon green"><ShieldCheck size={19} /></span>
            <div>
              <span>Còn bảo hành</span>
              <strong>{activeWarrantyCount}</strong>
            </div>
          </div>

          <div className="customer-stat-card">
            <span className="customer-stat-icon violet"><Wrench size={19} /></span>
            <div>
              <span>Đã bảo trì</span>
              <strong>{services.length}</strong>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="customer-detail-loading">
          <div />
          <div />
          <div />
        </section>
      ) : (
        <section className="customer-detail-content">
          <aside className="customer-info-card">
            <div className="customer-section-heading">
              <UserRound size={17} />
              <h3>Thông tin khách hàng</h3>
            </div>

            <dl className="customer-info-list">
              <div>
                <dt>Họ tên</dt>
                <dd>{customer.name}</dd>
              </div>
              <div>
                <dt>Số điện thoại</dt>
                <dd>{customer.phone}</dd>
              </div>
              <div>
                <dt>Địa chỉ</dt>
                <dd>{customer.address || '—'}</dd>
              </div>
              <div>
                <dt>Ghi chú</dt>
                <dd>{customer.notes || '—'}</dd>
              </div>
            </dl>
          </aside>

          <div className="customer-activity">
            <section className="customer-activity-card">
              <header className="customer-activity-header">
                <div>
                  <span className="customer-section-icon green"><PianoIcon size={17} /></span>
                  <h3>Giao dịch đã ghi nhận</h3>
                </div>
                <span>{purchases.length} cây</span>
              </header>

              {purchases.length === 0 ? (
                <div className="customer-empty-block">
                  <PianoIcon size={23} />
                  <strong>Chưa có giao dịch</strong>
                  <span>Chưa phát sinh đơn mua hoặc phiếu liên quan.</span>
                </div>
              ) : (
                <div className="customer-purchase-list">
                  {purchases.map((item) => (
                    <article className="customer-purchase-card" key={item.piano_id}>
                      <div className="customer-piano-icon">
                        <PianoIcon size={24} strokeWidth={1.5} />
                      </div>

                      <div className="customer-purchase-main">
                        <div className="customer-purchase-title">
                          <div>
                            <h4>{item.piano_name}</h4>
                            <span className="mono">Serial: {item.serial_number || '—'}</span>
                          </div>

                          {item.warranty_status && <StatusBadge value={item.warranty_status} />}
                        </div>

                        <div className="customer-purchase-meta">
                          <span>
                            Mua ngày
                            <strong>{fmtDate(item.sale_date)}</strong>
                          </span>
                          <span>
                            Bảo hành đến
                            <strong>{fmtDate(item.warranty_end_date)}</strong>
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="customer-activity-card">
              <header className="customer-activity-header">
                <div>
                  <span className="customer-section-icon violet"><Wrench size={16} /></span>
                  <h3>Bảo trì / sửa chữa hậu mãi</h3>
                </div>
                <span>{services.length} lần</span>
              </header>

              {services.length === 0 ? (
                <div className="customer-empty-block compact">
                  <Wrench size={22} />
                  <strong>Chưa có lịch sử bảo trì</strong>
                  <span>Các lần chăm sóc sau bán sẽ hiển thị tại đây.</span>
                </div>
              ) : (
                <div className="customer-service-list">
                  {services.map((item, index) => (
                    <article className="customer-service-row" key={`${item.piano_name}-${item.service_date}-${index}`}>
                      <span className="customer-service-icon"><CheckCircle2 size={16} /></span>
                      <div className="customer-service-main">
                        <strong>{item.service_type}</strong>
                        <span>{item.piano_name}</span>
                      </div>
                      <div className="customer-service-date">
                        <span>{fmtDate(item.service_date)}</span>
                        {item.next_service_date && <small>Lần tới: {fmtDate(item.next_service_date)}</small>}
                      </div>
                      <StatusBadge value={item.status} />
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      )}
    </div>
  )
}

function CustomerNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="customer-detail-page">
      <div className="customer-detail-header">
        <div>
          <button type="button" className="customer-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            Quay lại danh sách
          </button>
          <h1>Chi tiết khách hàng</h1>
        </div>
      </div>

      <section className="customer-empty-block customer-detail-not-found">
        <strong>Không tìm thấy khách hàng</strong>
        <span>Khách hàng này không tồn tại hoặc đã bị xoá.</span>
      </section>
    </div>
  )
}

export function CustomersPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { customerId } = useParams()

  const initialSearch = params.get('search') || ''
  const [search, setSearch] = useState(initialSearch)
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [filter, setFilter] = useState<CustomerFilter>('all')

  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [detailProfile, setDetailProfile] = useState<CustomerProfile | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')

  const loadProfiles = async (customers: Customer[]) => {
    const profileRows = await Promise.all(
      customers.map(async (customer) => {
        const path = `/customers/${customer.id}/profile`
        const cached = getCachedResponse<CustomerProfile>(path)

        if (cached) {
          return { customer, profile: cached.data }
        }

        try {
          const customerProfile = await api<CustomerProfile>(path)
          return { customer, profile: customerProfile }
        } catch {
          return { customer, profile: null }
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
      const query = normalized ? `?search=${encodeURIComponent(normalized)}` : ''
      const path = `/customers${query}`
      const cached = getCachedResponse<Customer[]>(path)

      if (cached) {
        setRows([])
        await loadProfiles(cached.data)
      }

      const customers = await api<Customer[]>(path)
      await loadProfiles(customers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải khách hàng.')
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    void load(initialSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!customerId) {
      setDetailCustomer(null)
      setDetailProfile(null)
      setDetailLoading(false)
      setDetailError('')
      return
    }

    let active = true
    const path = `/customers/${customerId}/profile`
    const cached = getCachedResponse<CustomerProfile>(path)

    if (cached) {
      setDetailCustomer(cached.data.customer)
      setDetailProfile(cached.data)
      setDetailLoading(true)
      setDetailError('')
    } else {
      setDetailCustomer(null)
      setDetailProfile(null)
      setDetailLoading(true)
      setDetailError('')
    }

    void api<CustomerProfile>(path)
      .then((profile) => {
        if (!active) return
        setDetailCustomer(profile.customer)
        setDetailProfile(profile)
        setDetailError('')
      })
      .catch((err: unknown) => {
        if (!active) return
        setDetailCustomer(null)
        setDetailProfile(null)
        setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết khách hàng.')
      })
      .finally(() => {
        if (!active) return
        setDetailLoading(false)
      })

    return () => {
      active = false
    }
  }, [customerId])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows

    if (filter === 'purchased') {
      return rows.filter((row) => row.profile && row.profile.purchases.length > 0)
    }

    if (filter === 'maintenance') {
      return rows.filter((row) => row.profile && row.profile.services.length > 0)
    }

    return rows.filter((row) => {
      const purchase = getLatestPurchase(row.profile)
      return Boolean(purchase?.warranty_status)
    })
  }, [rows, filter])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    const normalized = search.trim()
    setParams(normalized ? { search: normalized } : {})
    void load(normalized)
  }

  const openCustomer = (customer: Customer) => {
    navigate(`/customers/${customer.id}`)
  }

  if (customerId) {
    return detailCustomer ? (
      <CustomerDetail
        customer={detailCustomer}
        profile={detailProfile}
        loading={detailLoading}
        error={detailError}
        onBack={() => navigate('/customers')}
      />
    ) : detailLoading ? (
      <div className="customer-detail-page">
        <div className="customer-detail-header">
          <div>
            <button
              type="button"
              className="customer-back-button"
              onClick={() => navigate('/customers')}
            >
              <ArrowLeft size={15} />
              Quay lại danh sách
            </button>

            <h1>Chi tiết khách hàng</h1>
            <p className="customer-detail-intro">Khối này chỉ tổng hợp dữ liệu đã phát sinh từ bán hàng và hậu mãi.</p>
          </div>
        </div>

        <section className="customer-detail-loading">
          <div />
          <div />
          <div />
        </section>
      </div>
    ) : (
      <CustomerNotFound onBack={() => navigate('/customers')} />
    )
  }

  return (
    <div className="customers-page">
      <PageHeader
        title="Khách hàng"
        subtitle="Hồ sơ khách, lịch sử mua, bảo hành và bảo trì"
        actions={null}
      />

      {error && <div className="error-banner">{error}</div>}

      <section className="panel customers-toolbar">
        <form className="customers-search" onSubmit={submitSearch}>
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tên hoặc số điện thoại..."
          />
          {search.trim() && (
            <button type="submit" className="customers-search-submit">
              Tìm
            </button>
          )}
        </form>

        <div className="customer-filter-tabs">
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            <ListFilter size={15} />
            {customerFilterLabels.all}
          </button>
          <button type="button" className={filter === 'warranty' ? 'active' : ''} onClick={() => setFilter('warranty')}>
            <ShieldCheck size={15} />
            {customerFilterLabels.warranty}
          </button>
          <button type="button" className={filter === 'purchased' ? 'active' : ''} onClick={() => setFilter('purchased')}>
            <Clock3 size={15} />
            {customerFilterLabels.purchased}
          </button>
          <button type="button" className={filter === 'maintenance' ? 'active' : ''} onClick={() => setFilter('maintenance')}>
            <Wrench size={15} />
            {customerFilterLabels.maintenance}
          </button>
        </div>

        <div className="customers-total">{filteredRows.length} khách</div>
      </section>

      <section className="panel customers-table-card">
        {listLoading && rows.length === 0 ? (
          <div className="customers-loading">Đang tải khách hàng...</div>
        ) : filteredRows.length === 0 ? (
          <div className="customers-loading">Không có khách phù hợp.</div>
        ) : (
          <div className="customers-table-wrap">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Đàn gần nhất</th>
                  <th>Bảo hành</th>
                  <th>Ngày mua</th>
                  <th>Ghi chú</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const item = row.customer
                  const latestPurchase = getLatestPurchase(row.profile)

                  return (
                    <tr key={item.id} className="customer-row" onClick={() => openCustomer(item)}>
                      <td>
                        <div className="customer-name-cell">
                          <div className="customer-avatar">{getInitials(item.name)}</div>
                          <div>
                            <strong>{item.name}</strong>
                            {item.address && <span>{item.address}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="customer-phone">{item.phone}</td>
                      <td>
                        {latestPurchase ? (
                          <div className="customer-piano">
                            <strong>{latestPurchase.piano_name}</strong>
                            <span>SN: {latestPurchase.serial_number || '—'}</span>
                          </div>
                        ) : (
                          <span className="customer-empty-value">Chưa mua</span>
                        )}
                      </td>
                      <td>
                        {latestPurchase?.warranty_status ? <StatusBadge value={latestPurchase.warranty_status} /> : '—'}
                      </td>
                      <td>{latestPurchase ? fmtDate(latestPurchase.sale_date) : '—'}</td>
                      <td>
                        <span className="customer-note">{item.notes || '—'}</span>
                      </td>
                      <td>
                        <ChevronRight className="customer-row-arrow" size={16} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <footer className="customers-table-footer">
              <span>
                Hiển thị <strong>{filteredRows.length}</strong> khách hàng
              </span>
              {listLoading && <span>Đang cập nhật...</span>}
            </footer>
          </div>
        )}
      </section>

    </div>
  )
}
