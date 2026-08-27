import { type FormEvent, useMemo, useState } from 'react'

import logoImage from '../../../img/logo.jpg'

import { PageHeader } from '../../components/ui/PageHeader'
import { ApiError } from '../../lib/api'

import { buildWarrantyNotes, createWarrantySale } from './lib/api'
import { formatPrintDate, SHOP_ADDRESS, SHOP_PHONES, SHOP_TITLE, getReceiptCode, getWarrantyPrintTitle, printLabel } from './lib/warranty-print'

import './warranties-print.css'

function fmtDate(value: string) {
  if (!value) return ' '
  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN')
}

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

type WarrantyFormErrors = Partial<Record<keyof WarrantyFormState, string>>

const initialForm: WarrantyFormState = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  pianoName: '',
  serialNumber: '',
  startDate: '',
  endDate: '',
  notes: '',
}

function hasLetter(value: string) {
  return /[A-Za-zÀ-ỹà-ỹ]/.test(value)
}

function hasDigit(value: string) {
  return /\d/.test(value)
}

function isTenDigitPhone(value: string) {
  return /^\d{10}$/.test(value)
}

function validateField(name: keyof WarrantyFormState, value: string, form: WarrantyFormState): string {
  const trimmed = value.trim()

  switch (name) {
    case 'customerName':
      if (!trimmed) return 'Họ tên khách hàng không được để trống.'
      if (!hasLetter(trimmed)) return 'Họ tên phải có chữ.'
      if (hasDigit(trimmed)) return 'Họ tên không được chứa số.'
      return ''
    case 'customerPhone':
      if (!trimmed) return 'Số điện thoại không được để trống.'
      if (!/^\d+$/.test(trimmed)) return 'Số điện thoại chỉ gồm số.'
      if (!isTenDigitPhone(trimmed)) return 'Số điện thoại phải đủ 10 chữ số.'
      return ''
    case 'customerAddress':
      if (!trimmed) return 'Địa chỉ không được để trống.'
      if (!hasLetter(trimmed)) return 'Địa chỉ phải có chữ.'
      return ''
    case 'pianoName':
      if (!trimmed) return 'Tên đàn không được để trống.'
      return ''
    case 'serialNumber':
      if (!trimmed) return 'Serial không được để trống.'
      if (!/^[A-Za-z0-9\-_.\s]+$/.test(trimmed)) return 'Serial chỉ gồm chữ, số và ký tự - _ .'
      return ''
    case 'startDate':
      if (!trimmed) return 'Vui lòng chọn ngày bắt đầu bảo hành.'
      if (new Date(`${trimmed}T00:00:00`) > new Date()) return 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày hiện tại.'
      if (form.endDate && new Date(`${form.endDate}T00:00:00`) <= new Date(`${trimmed}T00:00:00`)) return 'Ngày kết thúc phải sau ngày bắt đầu.'
      return ''
    case 'endDate':
      if (!trimmed) return 'Vui lòng chọn ngày kết thúc bảo hành.'
      if (form.startDate && new Date(`${trimmed}T00:00:00`) <= new Date(`${form.startDate}T00:00:00`)) return 'Ngày kết thúc phải sau ngày bắt đầu.'
      return ''
    case 'notes':
      return ''
    default:
      return ''
  }
}

export function WarrantiesPrintPage() {
  const [form, setForm] = useState<WarrantyFormState>(initialForm)
  const [errors, setErrors] = useState<WarrantyFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [savedReceipt, setSavedReceipt] = useState<string>('')
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

  const updateField = (name: keyof WarrantyFormState, value: string) => {
    setForm((current) => {
      const next = { ...current, [name]: value }
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: validateField(name, value, next),
        ...(name === 'startDate' ? { endDate: validateField('endDate', next.endDate, next) } : {}),
        ...(name === 'endDate' ? { startDate: validateField('startDate', next.startDate, next) } : {}),
      }))
      setError('')
      return next
    })
  }

  const submitAndPrint = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return

    const nextErrors: WarrantyFormErrors = {
      customerName: validateField('customerName', form.customerName, form),
      customerPhone: validateField('customerPhone', form.customerPhone, form),
      customerAddress: validateField('customerAddress', form.customerAddress, form),
      pianoName: validateField('pianoName', form.pianoName, form),
      serialNumber: validateField('serialNumber', form.serialNumber, form),
      startDate: validateField('startDate', form.startDate, form),
      endDate: validateField('endDate', form.endDate, form),
      notes: '',
    }
    setErrors(nextErrors)

    const hasError = Object.values(nextErrors).some(Boolean)
    if (hasError) {
      setError('Vui lòng sửa các lỗi trong form.')
      return
    }

    try {
      setSaving(true)
      setError('')
      setSavedReceipt('')
      const result = await createWarrantySale({
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
      setSavedReceipt(result.id)
      setForm(initialForm)
      setErrors({})
      document.title = getWarrantyPrintTitle(result)
      window.print()
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

  const fieldError = (name: keyof WarrantyFormState) => errors[name]

  return (
    <div className="warranty-create-page">
      <PageHeader
        title="Tạo phiếu bảo hành"
        actions={
          <button type="submit" form="warranty-create-form" className="primary-button print-hide" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu và in phiếu'}
          </button>
        }
      />

      {error && <div className="error-banner">{error}</div>}
      {savedReceipt && <div className="form-success">Đã lưu phiếu bảo hành #{savedReceipt}.</div>}

      <div className="warranty-create-layout">
        <form id="warranty-create-form" className="panel warranty-create-form print-hide" onSubmit={submitAndPrint}>
          <div className="warranty-form-fields">
            <label className={`warranty-field span-2 ${fieldError('customerName') ? 'has-error' : ''}`}>
              <span>Họ tên khách hàng</span>
              <input value={form.customerName} onChange={(event) => updateField('customerName', event.target.value)} placeholder="Nhập họ tên" />
              {fieldError('customerName') && <small className="field-error">{fieldError('customerName')}</small>}
            </label>
            <label className={`warranty-field ${fieldError('customerPhone') ? 'has-error' : ''}`}>
              <span>Số điện thoại</span>
              <input value={form.customerPhone} onChange={(event) => updateField('customerPhone', event.target.value)} placeholder="Nhập số điện thoại" />
              {fieldError('customerPhone') && <small className="field-error">{fieldError('customerPhone')}</small>}
            </label>
            <label className={`warranty-field span-2 ${fieldError('customerAddress') ? 'has-error' : ''}`}>
              <span>Địa chỉ</span>
              <input value={form.customerAddress} onChange={(event) => updateField('customerAddress', event.target.value)} placeholder="Nhập địa chỉ" />
              {fieldError('customerAddress') && <small className="field-error">{fieldError('customerAddress')}</small>}
            </label>
            <label className={`warranty-field span-2 ${fieldError('pianoName') ? 'has-error' : ''}`}>
              <span>Đàn</span>
              <input value={form.pianoName} onChange={(event) => updateField('pianoName', event.target.value)} placeholder="Nhập tên đàn / model" />
              {fieldError('pianoName') && <small className="field-error">{fieldError('pianoName')}</small>}
            </label>
            <label className={`warranty-field ${fieldError('serialNumber') ? 'has-error' : ''}`}>
              <span>Serial</span>
              <input value={form.serialNumber} onChange={(event) => updateField('serialNumber', event.target.value)} placeholder="Nhập serial" />
              {fieldError('serialNumber') && <small className="field-error">{fieldError('serialNumber')}</small>}
            </label>
            <label className={`warranty-field ${fieldError('startDate') ? 'has-error' : ''}`}>
              <span>Bắt đầu</span>
              <input type="date" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} />
              {fieldError('startDate') && <small className="field-error">{fieldError('startDate')}</small>}
            </label>
            <label className={`warranty-field ${fieldError('endDate') ? 'has-error' : ''}`}>
              <span>Kết thúc</span>
              <input type="date" value={form.endDate} onChange={(event) => updateField('endDate', event.target.value)} />
              {fieldError('endDate') && <small className="field-error">{fieldError('endDate')}</small>}
            </label>
            <label className="warranty-field span-2">
              <span>Ngày in</span>
              <input value={formatPrintDate(new Date())} readOnly />
            </label>
            <label className="warranty-field span-2">
              <span>Ghi chú</span>
              <textarea rows={3} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Điền lưu ý nếu có" />
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
