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

export function getReceiptCode(item: Warranty): string {
  const phoneTail = item.customer_phone.replace(/\D/g, '').slice(-3).padStart(3, '0')
  return `BH-${phoneTail}`
}

export function getWarrantyPrintTitle(item: Warranty): string {
  const phoneTail = item.customer_phone.replace(/\D/g, '').slice(-3).padStart(3, '0')
  return `PhieuBaoHanh_${phoneTail}`
}
