import { Printer } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { PageHeader } from '../../components/ui/PageHeader'
import { api, fmtDate } from '../../lib/api'
import type { Sale, Warranty } from '../../types'
import { formatPrintDate, SHOP_ADDRESS, SHOP_PHONES, SHOP_TITLE } from './lib/warranty-print'
import { createWarrantySale, type WarrantySaleResponse } from './lib/api'

import './warranties-print.css'

interface WarrantyFormState {
  saleId: string
  notes: string
  printDateTime: string
}

function getLocalDateTimeValue(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const initialState: WarrantyFormState = {
  saleId: '',
  notes: '',
  printDateTime: getLocalDateTimeValue(),
}

export function WarrantiesPrintPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [warranties, setWarranties] = useState<Warranty[]>([])
  const [form, setForm] = useState<WarrantyFormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedWarranty, setSavedWarranty] = useState<WarrantySaleResponse | null>(null)

  useEffect(() => {
    void api<Sale[]>('/sales').then(setSales).catch(() => setSales([]))
    void api<Warranty[]>('/warranties').then(setWarranties).catch(() => setWarranties([]))
  }, [])

  const selectedSale = sales.find((sale) => sale.id === form.saleId) ?? null
  const selectedWarranty = warranties.find((item) => item.sale_id === form.saleId) ?? null
  const printDateText = form.printDateTime ? formatPrintDate(new Date(form.printDateTime)) : formatPrintDate(new Date())
  const warrantyEndText = selectedWarranty?.end_date ? formatPrintDate(new Date(selectedWarranty.end_date)) : selectedSale?.warranty_end_date ? formatPrintDate(new Date(selectedSale.warranty_end_date)) : '—'
  const warrantyStartText = selectedWarranty?.start_date ? formatPrintDate(new Date(selectedWarranty.start_date)) : selectedSale?.sale_date ? fmtDate(selectedSale.sale_date) : '—'

  const submitAndPrint = async () => {
    if (saving || !selectedSale) return
    setSaving(true)
    setError(null)
    try {
      const result = await createWarrantySale({
        customer: {
          name: selectedSale.customer_name,
          phone: selectedSale.customer_phone,
          address: selectedWarranty?.customer_address || '',
        },
        serial_number: selectedSale.serial_number,
        sale_date: selectedSale.sale_date,
        warranty_months: 12,
        notes: form.notes.trim() || null,
      })
      setSavedWarranty(result)
      setTimeout(() => requestAnimationFrame(() => window.print()), 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu phiếu bảo hành.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="warranty-create-page">
      <PageHeader
        title="Phiếu bảo hành"
        subtitle="Chọn giao dịch rồi lưu trước khi in."
        actions={<button type="button" className="primary-button print-hide" onClick={submitAndPrint} disabled={saving || !selectedSale}><Printer size={16} />{saving ? 'Đang lưu...' : 'Lưu & in phiếu'}</button>}
      />

      <div className="warranty-create-layout">
        <form className="panel warranty-create-form print-hide" onSubmit={(event) => event.preventDefault()}>
          <div className="warranty-form-heading">
            <div className="warranty-form-heading-icon"><Printer size={18} /></div>
            <div>
              <h3>Thông tin phiếu</h3>
              <p>Chọn sale đã có sẵn để tự điền khách hàng, đàn và serial.</p>
            </div>
          </div>

          <div className="warranty-form-fields">
            <label className="warranty-field span-2">
              <span>Giao dịch đã bán</span>
              <select value={form.saleId} onChange={(event) => setForm((current) => ({ ...current, saleId: event.target.value }))}>
                <option value="">Chọn sale</option>
                {sales.map((sale) => <option key={sale.id} value={sale.id}>{sale.customer_name} · {sale.piano_name}{sale.serial_number ? ` · ${sale.serial_number}` : ''}</option>)}
              </select>
            </label>
            <label className="warranty-field">
              <span>Khách hàng</span>
              <input value={selectedSale?.customer_name || ''} readOnly />
            </label>
            <label className="warranty-field">
              <span>Số điện thoại</span>
              <input value={selectedSale?.customer_phone || ''} readOnly />
            </label>
            <label className="warranty-field span-2">
              <span>Địa chỉ</span>
              <input value={selectedWarranty?.customer_address || '—'} readOnly />
            </label>
            <label className="warranty-field">
              <span>Đàn</span>
              <input value={selectedSale?.piano_name || ''} readOnly />
            </label>
            <label className="warranty-field">
              <span>Serial</span>
              <input value={selectedSale?.serial_number || ''} readOnly />
            </label>
            <label className="warranty-field">
              <span>Ngày bán</span>
              <input value={selectedSale ? fmtDate(selectedSale.sale_date) : ''} readOnly />
            </label>
            <label className="warranty-field">
              <span>Ngày bắt đầu</span>
              <input value={warrantyStartText} readOnly />
            </label>
            <label className="warranty-field">
              <span>Ngày hết hạn</span>
              <input value={warrantyEndText} readOnly />
            </label>
            <label className="warranty-field span-2">
              <span>Ngày giờ in</span>
              <input type="datetime-local" value={form.printDateTime} onChange={(event) => setForm((current) => ({ ...current, printDateTime: event.target.value }))} />
            </label>
            <label className="warranty-field span-2">
              <span>Ghi chú</span>
              <textarea rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Điền lưu ý nếu có" />
            </label>
          </div>
          {error ? <p className="warranty-form-error">{error}</p> : null}
          {savedWarranty ? <p className="warranty-save-success">Đã lưu phiếu {savedWarranty.id.slice(0, 8).toUpperCase()}</p> : null}
        </form>

        <section className="warranty-preview-panel">
          <div className="warranty-preview-scroll">
            <div className="warranty-print-document">
              <header className="warranty-print-header">
                <div className="warranty-print-brand"><div className="warranty-print-logo-mark">PS</div></div>
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
                  <h1>PHIẾU BẢO HÀNH</h1>
                  <div className="warranty-print-ornament"><span /><b>◆</b><i>◇</i><b>◆</b><span /></div>
                </div>
                <div className="warranty-print-code"><span>Mã phiếu:</span><strong>{savedWarranty ? `BH-${savedWarranty.id.slice(0, 8).toUpperCase()}` : 'BH-TẠM'}</strong></div>
              </div>
              <section className="warranty-print-section">
                <div className="warranty-print-section-title">1. THÔNG TIN KHÁCH HÀNG</div>
                <table className="warranty-print-table"><tbody>
                  <tr><th>Họ tên khách hàng</th><td><strong>{selectedSale?.customer_name || '—'}</strong></td></tr>
                  <tr><th>Số điện thoại</th><td><strong>{selectedSale?.customer_phone || '—'}</strong></td></tr>
                  <tr><th>Địa chỉ</th><td>{selectedWarranty?.customer_address || '—'}</td></tr>
                </tbody></table>
              </section>
              <section className="warranty-print-section">
                <div className="warranty-print-section-title">2. THÔNG TIN SẢN PHẨM</div>
                <table className="warranty-print-table"><tbody>
                  <tr><th>Sản phẩm</th><td>{selectedSale?.piano_name || '—'}</td></tr>
                  <tr><th>Số Serial</th><td>{selectedSale?.serial_number || '—'}</td></tr>
                  <tr><th>Ngày bán</th><td>{selectedSale ? fmtDate(selectedSale.sale_date) : '—'}</td></tr>
                  <tr><th>Ngày bắt đầu</th><td>{warrantyStartText}</td></tr>
                  <tr><th>Ngày hết hạn bảo hành</th><td>{warrantyEndText}</td></tr>
                </tbody></table>
              </section>
              <section className="warranty-print-section warranty-print-text-section">
                <div className="warranty-print-section-title">3. GHI CHÚ</div>
                <div className="warranty-print-notes-box">{selectedSale?.notes || form.notes || '—'}</div>
              </section>
              <div className="warranty-print-footer-note">TP. Hồ Chí Minh, ngày {printDateText}</div>
              <footer className="warranty-print-signatures">
                <div className="warranty-print-signature"><strong>KHÁCH HÀNG</strong><span>(Ký và ghi rõ họ tên)</span><div className="warranty-print-customer-sign-line" /></div>
                <div className="warranty-print-signature"><strong>ĐẠI DIỆN CỬA HÀNG</strong><span>(Ký và ghi rõ họ tên)</span><div className="warranty-print-shop-signature-area"><div className="warranty-print-stamp"><div className="warranty-print-stamp-ring"><small>PIANO • SOLNA</small><div>PIANO<br />SOLNA</div></div></div><div className="warranty-print-signature-writing">Piano Solna</div></div></div>
              </footer>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
