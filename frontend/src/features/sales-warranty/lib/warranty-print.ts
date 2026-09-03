import type { Warranty } from '../../../types'

export const SHOP_TITLE = 'PIANO SOLNA'
export const SHOP_ADDRESS = '140/27/11 Đường Vườn Lài, Phường An Phú Đông, Quận 12, TP.HCM'
export const SHOP_PHONES = ['090 687 6281', '0896 405 421', '0705 210 821']
export const WARRANTY_TERMS = [
  'Sản phẩm được bảo hành miễn phí đối với lỗi kỹ thuật do nhà sản xuất.',
  'Phiếu này phải được xuất trình khi yêu cầu bảo hành.',
  'Không bảo hành với hư hỏng do va đập, rơi vỡ, dùng sai hướng dẫn, tự ý sửa chữa, thiên tai hoặc hỏa hoạn.',
]
export const WARRANTY_NOTES = ['Giữ phiếu cẩn thận để đối chiếu khi cần bảo hành.', 'Vui lòng liên hệ cửa hàng trước khi mang sản phẩm đến bảo hành.']

export function formatPrintDate(value: Date): string {
  return new Intl.DateTimeFormat('vi-VN').format(value)
}

export function getWarrantyMonths(item: Warranty): string {
  const diffMs = new Date(item.end_date).getTime() - new Date(item.start_date).getTime()
  const months = Math.max(Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)), 0)
  if (months >= 12) return `${Math.round(months / 12)} năm`
  return `${months} tháng`
}

export function printLabel(value: string | null | undefined): string {
  return value && value.trim() ? value : '—'
}

export function createWarrantyCode(phone: string, databaseId: string): string {
  const normalizedPhone = phone.replace(/\D+/g, '')
  if (normalizedPhone.length < 3) {
    throw new Error('Số điện thoại không hợp lệ.')
  }

  const phoneSuffix = normalizedPhone.slice(-3)
  const normalizedId = databaseId.replace(/\s+/g, '').toUpperCase()
  if (!normalizedId || normalizedId === '—') {
    throw new Error('Mã bảo hành không hợp lệ.')
  }

  const idSuffix = normalizedId.slice(-6)
  if (!idSuffix) {
    throw new Error('Mã bảo hành không hợp lệ.')
  }

  return `BH-${phoneSuffix}-${idSuffix}`
}

interface WarrantyPrintItem {
  receipt_id: string
}

export function getReceiptCode(item: WarrantyPrintItem): string {
  const normalized = item.receipt_id.replace(/\s+/g, '').toUpperCase()
  if (!normalized || normalized === '—') {
    throw new Error('Mã bảo hành không hợp lệ.')
  }

  const suffix = normalized.slice(-6)
  if (!suffix) {
    throw new Error('Mã bảo hành không hợp lệ.')
  }

  return `BH-${suffix}`
}

export function assertWarrantyReceiptId(receiptId: string | null | undefined): string {
  const normalized = receiptId?.replace(/\s+/g, '').toUpperCase() ?? ''
  if (!normalized || normalized === '—') {
    throw new Error('Mã bảo hành không được để trống.')
  }

  return normalized
}
export function getWarrantyPrintTitle(item: WarrantyPrintItem): string {
  const suffix = item.receipt_id.replace(/\s+/g, '').slice(-6).toUpperCase()
  return suffix ? `PhieuBaoHanh_${suffix}` : 'PhieuBaoHanh'
}
