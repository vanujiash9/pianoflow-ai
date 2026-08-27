import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Piano as PianoIcon,
  Phone,
  ShieldCheck,
  ShoppingBag,
  UserRound,
  Wrench,
} from 'lucide-react'

import { StatusBadge } from '../../components/ui/StatusBadge'
import { fmtDate } from '../../lib/api'
import type { Customer, CustomerProfile } from '../../types'

import './customer-detail.css'

interface CustomerDetailProps {
  customer?: Customer
  profile?: CustomerProfile | null
  loading?: boolean
  error?: string
  onBack?: () => void
}

const EMPTY_CUSTOMER = {
  id: '',
  name: '',
  phone: '',
  address: null,
  notes: null,
  created_at: '',
  updated_at: '',
} satisfies Customer

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase()
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

export function CustomerDetail({
  customer = EMPTY_CUSTOMER,
  profile = null,
  loading = false,
  error = '',
  onBack = () => {},
}: CustomerDetailProps) {
  const purchases = profile?.purchases ?? []
  const services = profile?.services ?? []
  const activeWarrantyCount = purchases.filter((item) =>
    isActiveWarranty(item.warranty_status),
  ).length

  return (
    <main className="customer-detail-page">
      <header className="customer-detail-header">
        <div className="customer-detail-header-copy">
          <button type="button" className="customer-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Quay lại danh sách</span>
          </button>

          <h1>Chi tiết khách hàng</h1>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <section className="customer-detail-loading" aria-label="Đang tải">
          <div className="customer-skeleton customer-skeleton-hero" />
          <div className="customer-skeleton customer-skeleton-side" />
          <div className="customer-skeleton customer-skeleton-main" />
        </section>
      ) : (
        <>
          <section className="customer-detail-hero panel">
            <div className="customer-detail-person">
              <div className="customer-detail-avatar" aria-hidden="true">
                {getInitials(customer.name)}
              </div>

              <div className="customer-detail-person-copy">
                <div className="customer-detail-name-row">
                  <h2>{customer.name}</h2>
                  <span className="customer-type-badge">Khách hàng</span>
                </div>

                <div className="customer-detail-meta">
                  <div className="customer-detail-meta-item">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>

                  <div className="customer-detail-meta-item">
                    <MapPin size={14} />
                    <span>{customer.address || 'Chưa có địa chỉ'}</span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="customer-detail-note">
                    {customer.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="customer-detail-stats">
              <div className="customer-stat-card">
                <span className="customer-stat-icon blue">
                  <ShoppingBag size={17} />
                </span>
                <div>
                  <span>Đã mua đàn</span>
                  <strong>{purchases.length}</strong>
                </div>
              </div>

              <div className="customer-stat-card">
                <span className="customer-stat-icon green">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <span>Còn bảo hành</span>
                  <strong>{activeWarrantyCount}</strong>
                </div>
              </div>

              <div className="customer-stat-card">
                <span className="customer-stat-icon violet">
                  <Wrench size={17} />
                </span>
                <div>
                  <span>Đã bảo trì</span>
                  <strong>{services.length}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="customer-detail-grid">
            <aside className="customer-info-card panel">
              <div className="customer-section-heading">
                <UserRound size={17} />

                <div>
                  <h3>Thông tin khách hàng</h3>
                  <p>Thông tin dùng để đối chiếu giao dịch và hậu mãi.</p>
                </div>
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
              <section className="customer-activity-card panel">
                <header className="customer-activity-header">
                  <div>
                    <span className="customer-section-icon green">
                      <PianoIcon size={16} />
                    </span>

                    <div>
                      <h3>Giao dịch đã ghi nhận</h3>
                      <p>{purchases.length} cây đàn</p>
                    </div>
                  </div>
                </header>

                {purchases.length === 0 ? (
                  <div className="customer-empty-block">
                    <PianoIcon size={22} />
                    <strong>Chưa có giao dịch</strong>
                    <span>Chưa phát sinh đơn mua hoặc phiếu liên quan.</span>
                  </div>
                ) : (
                  <div className="customer-purchase-list">
                    {purchases.map((item) => (
                      <article
                        className="customer-purchase-card"
                        key={item.piano_id}
                      >
                        <div className="customer-piano-icon">
                          <PianoIcon size={20} strokeWidth={1.6} />
                        </div>

                        <div className="customer-purchase-main">
                          <div className="customer-purchase-title">
                            <div>
                              <h4>{item.piano_name}</h4>
                              <span className="mono">
                                Serial: {item.serial_number || '—'}
                              </span>
                            </div>

                            {item.warranty_status && (
                              <StatusBadge value={item.warranty_status} />
                            )}
                          </div>

                          <div className="customer-purchase-meta">
                            <span>
                              Mua ngày <strong>{fmtDate(item.sale_date)}</strong>
                            </span>
                            <span>
                              Bảo hành đến {' '}
                              <strong>{fmtDate(item.warranty_end_date)}</strong>
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="customer-activity-card panel">
                <header className="customer-activity-header">
                  <div>
                    <span className="customer-section-icon violet">
                      <Wrench size={16} />
                    </span>

                    <div>
                      <h3>Bảo trì / sửa chữa hậu mãi</h3>
                      <p>{services.length} lần</p>
                    </div>
                  </div>
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
                      <article
                        className="customer-service-row"
                        key={`${item.piano_name}-${item.service_date}-${index}`}
                      >
                        <span className="customer-service-icon">
                          <CheckCircle2 size={15} />
                        </span>

                        <div className="customer-service-main">
                          <strong>{item.service_type}</strong>
                          <span>{item.piano_name}</span>
                        </div>

                        <div className="customer-service-date">
                          <span>{fmtDate(item.service_date)}</span>
                          {item.next_service_date && (
                            <small>
                              Lần tới: {fmtDate(item.next_service_date)}
                            </small>
                          )}
                        </div>

                        <StatusBadge value={item.status} />
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export function CustomerNotFound({ onBack }: { onBack: () => void }) {
  return (
    <main className="customer-detail-page">
      <header className="customer-detail-header">
        <div className="customer-detail-header-copy">
          <button type="button" className="customer-back-button" onClick={onBack}>
            <ArrowLeft size={15} />
            <span>Quay lại danh sách</span>
          </button>

          <h1>Chi tiết khách hàng</h1>
          <p className="customer-detail-intro">
            Khách hàng này không tồn tại hoặc đã bị xoá.
          </p>
        </div>
      </header>

      <section className="customer-empty-block customer-detail-not-found panel">
        <strong>Không tìm thấy khách hàng</strong>
        <span>Khách hàng này không tồn tại hoặc đã bị xoá.</span>
      </section>
    </main>
  )
}
