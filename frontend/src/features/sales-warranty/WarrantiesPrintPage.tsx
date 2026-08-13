import { Printer } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '../../components/ui/PageHeader'
import { ApiError } from '../../lib/api'
import { formatPrintDate, SHOP_ADDRESS, SHOP_PHONES, SHOP_TITLE } from './lib/warranty-print'
import { createWarrantySale, type WarrantySaleResponse } from './lib/api'

import './warranties-print.css'

interface WarrantyFormState {
  customerName: string
  customerPhone: string
  customerAddress: string
  serialNumber: string
  warrantyMonths: string
  notes: string
  printDateTime: string
}

function getLocalDateTimeValue(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function getWarrantyEndText(dateTimeValue: string, monthsValue: string): string {
  const months = Number(monthsValue) || 0
  const baseDate = dateTimeValue ? new Date(dateTimeValue) : new Date()
  const endDate = new Date(baseDate)
  endDate.setMonth(endDate.getMonth() + months)
  return formatPrintDate(endDate)
}

const initialState: WarrantyFormState = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  serialNumber: '',
  warrantyMonths: '12',
  notes: '',
  printDateTime: getLocalDateTimeValue(),
}

export function WarrantiesPrintPage() {
  const [form, setForm] = useState<WarrantyFormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedSale, setSavedSale] = useState<WarrantySaleResponse | null>(null)

  const printDateText = useMemo(() => {
    if (!form.printDateTime) return formatPrintDate(new Date())
    return formatPrintDate(new Date(form.printDateTime))
  }, [form.printDateTime])

  const warrantyEndText = useMemo(
    () => getWarrantyEndText(form.printDateTime, form.warrantyMonths),
    [form.printDateTime, form.warrantyMonths],
  )

  const updateField = <K extends keyof WarrantyFormState>(key: K, value: WarrantyFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submitAndPrint = async () => {
    if (saving) return

    const customerName = form.customerName.trim()
    const customerPhone = form.customerPhone.trim()
    const customerAddress = form.customerAddress.trim()
    const serialNumber = form.serialNumber.trim()

    if (!customerName || !customerPhone || !serialNumber) {
      setError('Nhập đủ tên khách hàng, số điện thoại và serial đàn.')
      return
    }

    const warrantyMonths = Number(form.warrantyMonths)
    if (!Number.isInteger(warrantyMonths) || warrantyMonths <= 0) {
      setError('Thời hạn bảo hành phải lớn hơn 0.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const result = await createWarrantySale({
        customer: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
        serial_number: serialNumber,
        sale_date: form.printDateTime ? form.printDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10),
        warranty_months: warrantyMonths,
        notes: form.notes.trim() || null,
      })
      setSavedSale(result)
      setError(null)
      setTimeout(() => {
        requestAnimationFrame(() => {
          window.print()
        })
      }, 0)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Không thể lưu phiếu bảo hành.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="warranty-create-page">
      <PageHeader
        title="Phiếu bảo hành"
        subtitle="Điền thông tin rồi lưu trước khi in."
        actions={
          <button type="button" className="primary-button print-hide" onClick={submitAndPrint} disabled={saving}>
            <Printer size={16} />
            {saving ? 'Đang lưu...' : 'Lưu & in phiếu'}
          </button>
        }
      />

      <div className="warranty-create-layout">
        <form className="panel warranty-create-form print-hide" onSubmit={(event) => event.preventDefault()}>
          <div className="warranty-form-heading">
            <div className="warranty-form-heading-icon">
              <Printer size={18} />
            </div>
            <div>
              <h3>Thông tin phiếu</h3>
              <p>Điền dữ liệu trước khi in.</p>
            </div>
          </div>

          <div className="warranty-form-fields">
            <label className="warranty-field">
              <span>Khách hàng</span>
              <input value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} placeholder="Nguyễn Văn A" />
            </label>
            <label className="warranty-field">
              <span>Số điện thoại</span>
              <input value={form.customerPhone} onChange={(event) => updateField('customerPhone', event.target.value)} placeholder="0901234567" />
            </label>
            <label className="warranty-field span-2">
              <span>Địa chỉ</span>
              <input value={form.customerAddress} onChange={(event) => updateField('customerAddress', event.target.value)} placeholder="Quận 12, TP.HCM" />
            </label>
            <label className="warranty-field">
              <span>Serial đàn</span>
              <input value={form.serialNumber} onChange={(event) => updateField('serialNumber', event.target.value)} placeholder="AB123456" />
            </label>
            <label className="warranty-field">
              <span>Thời hạn bảo hành (tháng)</span>
              <input type="number" min="1" max="120" value={form.warrantyMonths} onChange={(event) => updateField('warrantyMonths', event.target.value)} />
            </label>
            <label className="warranty-field span-2">
              <span>Ngày giờ in</span>
              <input type="datetime-local" value={form.printDateTime} onChange={(event) => updateField('printDateTime', event.target.value)} />
            </label>
            <label className="warranty-field span-2">
              <span>Ghi chú</span>
              <textarea rows={4} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Điền lưu ý nếu có" />
            </label>
          </div>
          {error ? <p className="warranty-form-error">{error}</p> : null}
          {savedSale ? (
            <p className="warranty-save-success">
              Đã lưu phiếu {savedSale.id.slice(0, 8).toUpperCase()}
            </p>
          ) : null}
        </form>

        <section className="warranty-preview-panel">
          <div className="warranty-preview-scroll">
            <div className="warranty-print-document">
              <header className="warranty-print-header">
                <div className="warranty-print-brand">
                  <div className="warranty-print-logo-mark">PS</div>
                </div>
                <div className="warranty-print-shopinfo">
                  <div className="warranty-print-shopname">{SHOP_TITLE}</div>
                  <div className="warranty-print-location-label">Trụ sở chính / Kho TP.HCM:</div>
                  <div className="warranty-print-address">{SHOP_ADDRESS}</div>
                  <div className="warranty-print-phones">
                    {SHOP_PHONES.map((phone) => (
                      <span key={phone}>{phone}</span>
                    ))}
                  </div>
                </div>
                <div className="warranty-print-header-spacer" />
              </header>

              <div className="warranty-print-header-line" />

              <div className="warranty-print-title-wrap">
                <div className="warranty-print-main-title">
                  <h1>PHIẾU BẢO HÀNH</h1>
                  <div className="warranty-print-ornament">
                    <span />
                    <b>◆</b>
                    <i>◇</i>
                    <b>◆</b>
                    <span />
                  </div>
                </div>
                <div className="warranty-print-code">
                  <span>Mã phiếu:</span>
                  <strong>{savedSale ? `BH-${savedSale.id.slice(0, 8).toUpperCase()}` : 'BH-TẠM'}</strong>
                </div>
              </div>

              <section className="warranty-print-section">
                <div className="warranty-print-section-title">1. THÔNG TIN KHÁCH HÀNG</div>
                <table className="warranty-print-table">
                  <tbody>
                    <tr>
                      <th>Họ tên khách hàng</th>
                      <td><strong>{savedSale?.customer_name || form.customerName || '—'}</strong></td>
                    </tr>
                    <tr>
                      <th>Số điện thoại</th>
                      <td><strong>{savedSale?.customer_phone || form.customerPhone || '—'}</strong></td>
                    </tr>
                    <tr>
                      <th>Địa chỉ</th>
                      <td>{savedSale?.customer_address || form.customerAddress || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="warranty-print-section">
                <div className="warranty-print-section-title">2. THÔNG TIN SẢN PHẨM</div>
                <table className="warranty-print-table">
                  <tbody>
                    <tr>
                      <th>Số Serial</th>
                      <td>{savedSale?.serial_number || form.serialNumber || '—'}</td>
                    </tr>
                    <tr>
                      <th>Ngày in phiếu</th>
                      <td>{printDateText}</td>
                    </tr>
                    <tr>
                      <th>Thời hạn bảo hành</th>
                      <td>{form.warrantyMonths || '0'} tháng</td>
                    </tr>
                    <tr>
                      <th>Ngày hết hạn bảo hành</th>
                      <td>{savedSale?.warranty_end_date ? formatPrintDate(new Date(savedSale.warranty_end_date)) : warrantyEndText}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="warranty-print-section warranty-print-text-section">
                <div className="warranty-print-section-title">3. GHI CHÚ</div>
                <div className="warranty-print-notes-box">{savedSale?.notes || form.notes || '—'}</div>
              </section>

              <div className="warranty-print-footer-note">TP. Hồ Chí Minh, ngày {printDateText}</div>

              <footer className="warranty-print-signatures">
                <div className="warranty-print-signature">
                  <strong>KHÁCH HÀNG</strong>
                  <span>(Ký và ghi rõ họ tên)</span>
                  <div className="warranty-print-customer-sign-line" />
                </div>
                <div className="warranty-print-signature">
                  <strong>ĐẠI DIỆN CỬA HÀNG</strong>
                  <span>(Ký và ghi rõ họ tên)</span>
                  <div className="warranty-print-shop-signature-area">
                    <div className="warranty-print-stamp">
                      <div className="warranty-print-stamp-ring">
                        <small>PIANO • SOLNA</small>
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
