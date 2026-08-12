import { Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { StatusBadge } from '../components/StatusBadge'
import { api, fmtDate } from '../lib/api'
import type { Warranty } from '../types'

export function WarrantiesPrintPage() {
  const [items, setItems] = useState<Warranty[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api<Warranty[]>('/warranties')
      .then(setItems)
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <div className="print-page">
      <PageHeader
        title="In bảo hành"
        subtitle="Bố cục A4 gọn để in trực tiếp cho khách mang về shop hoặc gửi file PDF."
        actions={
          <button type="button" className="primary-button print-hide" onClick={() => window.print()}>
            <Printer size={16} /> In A4
          </button>
        }
      />
      {error && <div className="error-banner print-hide">{error}</div>}
      {items.length === 0 ? (
        <div className="panel print-sheet">
          <EmptyState title="Chưa có bảo hành" description="Tạo bán hàng trước rồi quay lại in phiếu bảo hành." />
        </div>
      ) : (
        <div className="print-list">
          {items.map((item) => (
            <section className="print-sheet" key={item.id}>
              <div className="print-sheet-header">
                <div>
                  <div className="eyebrow">PianoFlow Warranty</div>
                  <h1>PHIẾU BẢO HÀNH</h1>
                </div>
                <div className="print-meta">
                  <span>Mã phiếu</span>
                  <strong>{item.id}</strong>
                </div>
              </div>

              <div className="print-grid">
                <div>
                  <span>Khách hàng</span>
                  <strong>{item.customer_name}</strong>
                </div>
                <div>
                  <span>Số điện thoại</span>
                  <strong>{item.customer_phone}</strong>
                </div>
                <div>
                  <span>Đàn</span>
                  <strong>{item.piano_name}</strong>
                </div>
                <div>
                  <span>Serial</span>
                  <strong className="mono">{item.serial_number}</strong>
                </div>
                <div>
                  <span>Bắt đầu</span>
                  <strong>{fmtDate(item.start_date)}</strong>
                </div>
                <div>
                  <span>Kết thúc</span>
                  <strong>{fmtDate(item.end_date)}</strong>
                </div>
              </div>

              <div className="print-footer">
                <StatusBadge value={item.status} />
                <div>Ghi chú: {item.notes || '—'}</div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
