import { Printer } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'

import logoImage from '../../../img/logo.jpg'

import { PageHeader } from '../../components/ui/PageHeader'
import { ApiError } from '../../lib/api'

import { buildWarrantyNotes, createWarrantySale } from './lib/api'
import { formatPrintDate, SHOP_ADDRESS, SHOP_PHONES, SHOP_TITLE, getReceiptCode, printLabel } from './lib/warranty-print'

function fmtDate(value: string) {
  if (!value) return ' '
  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN')
}

import './warranties-print.css'

type WarrantyFormState = {
  customerName: string
  customerPhone: string
  customerAddress: string
  pianoName: string
  serialNumber: string
  startDate: string
  endDate: string
  notes: string
}

const initialState: WarrantyFormState = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  pianoName: '',
  serialNumber: '',
  startDate: '',
  endDate: '',
  notes: '',
}

export function WarrantiesPrintPage() {
  const [form, setForm] = useState<WarrantyFormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const receiptCode = useMemo(() => {
    const seed = [form.customerPhone, form.serialNumber].map((value) => value.trim()).filter(Boolean).join('|')
    return seed ? getReceiptCode({ customer_phone: form.customerPhone, serial_number: form.serialNumber } as never) : '—'
  }, [form.customerPhone, form.serialNumber])

  const warrantyMonths = useMemo(() => {
    if (!form.startDate || !form.endDate) return 1
    const diffMs = new Date(`${form.endDate}T00:00:00`).getTime() - new Date(`${form.startDate}T00:00:00`).getTime()
    return Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)), 1)
  }, [form.endDate, form.startDate])

  const submitAndPrint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    if (!form.customerName.trim()) {
      setError('Vui lòng nhập họ tên khách hàng.')
      return
    }
    if (!form.customerPhone.trim()) {
      setError('Vui lòng nhập số điện thoại.')
      return
    }
    if (!form.serialNumber.trim()) {
      setError('Vui lòng nhập serial đàn.')
      return
    }
    if (!form.startDate) {
      setError('Vui lòng chọn ngày bắt đầu bảo hành.')
      return
    }
    if (!form.endDate) {
      setError('Vui lòng chọn ngày kết thúc bảo hành.')
      return
    }
    if (new Date(`${form.endDate}T00:00:00`) <= new Date(`${form.startDate}T00:00:00`)) {
      setError('Ngày kết thúc phải sau ngày bắt đầu.')
      return
    }

    try {
      setSaving(true)
      setError('')
      await createWarrantySale({
        customer: {
          name: form.customerName.trim(),
          phone: form.customerPhone.trim(),
          address: form.customerAddress.trim() || '',
        },
        piano_name: form.pianoName.trim(),
        serial_number: form.serialNumber.trim(),
        sale_date: form.startDate,
        warranty_months: warrantyMonths,
        notes: form.notes.trim() || null,
      })
      setTimeout(() => requestAnimationFrame(() => window.print()), 0)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Không thể lưu phiếu bảo hành.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="warranty-create-page">
      <PageHeader
        title="Tạo phiếu bảo hành"
        subtitle="Nhập khách hàng, serial và thời gian bảo hành để lưu rồi in phiếu. Trường Đàn chỉ là ghi chú hiển thị, không dùng để tra cứu."
        actions={
          <button type="submit" form="warranty-create-form" className="primary-button print-hide" disabled={saving}>
            <Printer size={16} />
            {saving ? 'Đang lưu...' : 'Lưu và in phiếu'}
          </button>
        }
      />

      {error && <div className="error-banner">{error}</div>}

      <div className="warranty-create-layout">
        <form id="warranty-create-form" className="panel warranty-create-form print-hide" onSubmit={submitAndPrint}>
          <div className="warranty-form-fields">
            <label className="warranty-field span-2">
              <span>Họ tên khách hàng</span>
              <input value={form.customerName} onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} placeholder="Nhập họ tên" />
            </label>
            <label className="warranty-field">
              <span>Số điện thoại</span>
              <input value={form.customerPhone} onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} placeholder="Nhập số điện thoại" />
            </label>
            <label className="warranty-field span-2">
              <span>Địa chỉ</span>
              <input value={form.customerAddress} onChange={(event) => setForm((current) => ({ ...current, customerAddress: event.target.value }))} placeholder="Nhập địa chỉ" />
            </label>
            <label className="warranty-field span-2">
              <span>Đàn</span>
              <input value={form.pianoName} onChange={(event) => setForm((current) => ({ ...current, pianoName: event.target.value }))} placeholder="Nhập tên đàn / model" />
            </label>
            <label className="warranty-field">
              <span>Serial</span>
              <input value={form.serialNumber} onChange={(event) => setForm((current) => ({ ...current, serialNumber: event.target.value }))} placeholder="Nhập serial" />
            </label>
            <label className="warranty-field">
              <span>Bắt đầu</span>
              <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} />
            </label>
            <label className="warranty-field">
              <span>Kết thúc</span>
              <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} />
            </label>
            <label className="warranty-field span-2">
              <span>Ngày in</span>
              <input value={formatPrintDate(new Date())} readOnly />
            </label>
            <label className="warranty-field span-2">
              <span>Ghi chú</span>
              <textarea rows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Điền lưu ý nếu có" />
            </label>
          </div>
        </form>

        <section className="warranty-preview-panel">
          <div className="warranty-preview-scroll">
            <div className="warranty-print-document">
              <header className="warranty-print-header">
                <div className="warranty-print-brand">
                  <img className="warranty-print-logo-image" src={logoImage} alt="Logo Piano Solna" />
                </div>
                <div className="warranty-print-shopinfo">
                  <div className="warranty-print-shopname">{SHOP_TITLE}</div>
                  <div className="warranty-print-location-label">Trụ sở chính / Kho TP.HCM:</div>
                  <div className="warranty-print-address">{SHOP_ADDRESS}</div>
                  <div className="warranty-print-phones">{SHOP_PHONES.map((phone) => <span key={phone}>{phone}</span>)}</div>
                </div>
                <div className="warranty-print-header-spacer" />
              </header>
              <div className="warranty-print-header-line" />
              <div className="warranty-print-title-wrap">
                <div className="warranty-print-main-title">
                  <h1>
                    PHIẾU <span>BẢO HÀNH</span>
                  </h1>
                  <div className="warranty-print-ornament">
                    <span />
                    <b>●</b>
                    <b>●</b>
                    <b>●</b>
                    <span />
                  </div>
                </div>
                <div className="warranty-print-code">
                  <span>Mã phiếu:</span>
                  <strong>{receiptCode}</strong>
                </div>
              </div>

              <section className="warranty-print-section">
                <div className="warranty-print-section-title">
                  <span>1</span>
                  <strong>THÔNG TIN KHÁCH HÀNG</strong>
                </div>
                <table className="warranty-print-table">
                  <tbody>
                    <tr>
                      <th>Họ tên khách hàng</th>
                      <td>{form.customerName || ' '}</td>
                    </tr>
                    <tr>
                      <th>Số điện thoại</th>
                      <td>{form.customerPhone || ' '}</td>
                    </tr>
                    <tr>
                      <th>Địa chỉ</th>
                      <td>{printLabel(form.customerAddress) || ' '}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="warranty-print-section">
                <div className="warranty-print-section-title">
                  <span>2</span>
                  <strong>THÔNG TIN SẢN PHẨM</strong>
                </div>
                <table className="warranty-print-table">
                  <tbody>
                    <tr>
                      <th>Sản phẩm</th>
                      <td>{form.pianoName || ' '}</td>
                    </tr>
                    <tr>
                      <th>Serial</th>
                      <td>{printLabel(form.serialNumber) || ' '}</td>
                    </tr>
                    <tr>
                      <th>Bắt đầu</th>
                      <td>{form.startDate ? fmtDate(form.startDate) : ' '}</td>
                    </tr>
                    <tr>
                      <th>Kết thúc</th>
                      <td>{form.endDate ? fmtDate(form.endDate) : ' '}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="warranty-print-section warranty-print-text-section">
                <div className="warranty-print-section-title">
                  <span>3</span>
                  <strong>GHI CHÚ</strong>
                </div>
                <div className="warranty-print-notes-box">
                  <div className="warranty-print-notes-content">{form.notes || ' '}</div>
                  <div className="warranty-print-notes-lines" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </section>

              <div className="warranty-print-footer-note">TP. Hồ Chí Minh, ngày {formatPrintDate(new Date())}</div>
              <footer className="warranty-print-signatures">
                <div className="warranty-print-policy-block">
                  <div className="warranty-print-policy-title">CHÍNH SÁCH BẢO HÀNH</div>
                  <div className="warranty-print-policy-text">
                    {buildWarrantyNotes()
                      .split('\n')
                      .map((line, index) => {
                        const isSectionTitle = /^\d+\.\s/.test(line)
                        const isBullet = line.startsWith('- ')

                        return (
                          <p
                            key={`${index}-${line}`}
                            className={isSectionTitle ? 'is-section-title' : isBullet ? 'is-bullet' : 'is-intro'}
                          >
                            {isBullet ? line.slice(2) : line}
                          </p>
                        )
                      })}
                  </div>
                </div>
                <div className="warranty-print-shop-signature">
                  <strong>ĐẠI DIỆN CỬA HÀNG</strong>
                  <span>(Ký và ghi rõ họ tên)</span>
                  <div className="warranty-print-shop-signature-area">
                    <div className="warranty-print-stamp">
                      <div className="warranty-print-stamp-ring">
                        <small>PIANO SOLNA</small>
                        <div>
                          PIANO
                          <br />
                          SOLNA
                        </div>
                      </div>
                    </div>
                    <div className="warranty-print-signature-writing">Piano Solna</div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
