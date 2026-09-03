import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

import { PageHeader } from '../../components/ui/PageHeader'
import { ApiError } from '../../lib/api'

import { createWarrantySale } from './lib/api'
import { WarrantyPrintDocument } from './WarrantyPrintDocument'
import { type WarrantyPrintPayload, createWarrantyPrintPayload, readWarrantyPrintPayload, saveWarrantyPrintPayload } from './lib/warranty-print-session'
import { formatPrintDate, getWarrantyPrintTitle } from './lib/warranty-print'

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

type WarrantyFormErrors = Partial<Record<keyof WarrantyFormState, string>>

const emptyPrintPayload: WarrantyPrintPayload = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  pianoName: '',
  serialNumber: '',
  startDate: '',
  endDate: '',
  notes: '',
  receiptId: '—',
  createdAt: new Date().toISOString(),
}

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

async function waitForWarrantyAssets(): Promise<void> {
  await Promise.all(
    Array.from(document.images)
      .filter((image) => image.closest('.warranty-print-document') !== null)
      .map(async (image) => {
        if (image.complete) return
        await new Promise<void>((resolve) => {
          image.onload = () => resolve()
          image.onerror = () => resolve()
        })
      }),
  )
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
      if (!trimmed) return ''
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
  const [savedPrintPayload, setSavedPrintPayload] = useState<WarrantyPrintPayload | null>(null)
  const [error, setError] = useState('')
  const printDocumentRef = useRef<HTMLDivElement | null>(null)
  const pdfDownloadLockRef = useRef(false)

  useEffect(() => {
    const payload = readWarrantyPrintPayload()
    if (payload) {
      setSavedReceipt(payload.receiptId)
      setSavedPrintPayload(payload)
    }
  }, [])

  const previewPayload = savedPrintPayload ?? emptyPrintPayload
  const showPrintHint = !savedPrintPayload
  const canReprint = Boolean(savedPrintPayload)

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

  const downloadWarrantyPdf = async (payload: WarrantyPrintPayload) => {
    if (pdfDownloadLockRef.current) return
    const documentNode = printDocumentRef.current
    if (!documentNode) return

    pdfDownloadLockRef.current = true
    try {
      await waitForWarrantyAssets()
      const canvas = await html2canvas(documentNode, {
        scale: Math.max(window.devicePixelRatio || 1, 2),
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const imgX = 0
      const imgY = Math.max((pageHeight - imgHeight) / 2, 0)

      pdf.addImage(imageData, 'PNG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST')
      pdf.save(`PhieuBaoHanh_${payload.receiptId.replace(/\s+/g, '').slice(-6).toUpperCase()}.pdf`)
    } finally {
      pdfDownloadLockRef.current = false
    }
  }

  const receiptCode = savedPrintPayload ? `BH-${savedPrintPayload.receiptId.replace(/\s+/g, '').slice(-6).toUpperCase()}` : 'BH-000000'

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
      const result = await createWarrantySale({
        customer: {
          name: form.customerName.trim(),
          phone: form.customerPhone.trim(),
          address: form.customerAddress.trim() || '',
        },
        piano_name: form.pianoName.trim(),
        serial_number: form.serialNumber.trim() || null,
        sale_date: form.startDate,
        warranty_months: warrantyMonths,
        notes: form.notes.trim() || null,
      })
      const payload = createWarrantyPrintPayload(result.id, form)
      saveWarrantyPrintPayload(payload)
      setSavedReceipt(result.id)
      setSavedPrintPayload(payload)
      setForm(initialForm)
      setErrors({})
      document.title = getWarrantyPrintTitle({ receipt_id: result.id })
      await downloadWarrantyPdf(payload)
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
          <div className="warranty-page-actions">
            <button type="submit" form="warranty-create-form" className="primary-button print-hide" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu và in phiếu'}
            </button>
          </div>
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
          <div className="warranty-preview-toolbar">
            <span className="warranty-preview-label">Xem trước phiếu</span>
            {showPrintHint ? (
              <span className="warranty-preview-hint">Nhập xong thông tin rồi bấm “Lưu và in phiếu” để mở hộp thoại in.</span>
            ) : (
              <span className="warranty-preview-hint">Trên điện thoại bạn có thể cuộn ngang để xem đủ phiếu.</span>
            )}
          </div>
          <div className="warranty-preview-scroll">
            <WarrantyPrintDocument ref={printDocumentRef} payload={previewPayload} />
          </div>
        </section>
      </div>
    </div>
  )
}
