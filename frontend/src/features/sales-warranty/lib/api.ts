import { api } from '../../../lib/api'

export interface WarrantyCustomerInput {
  name: string
  phone: string
  address: string
}

export interface WarrantyCreateRequest {
  customer: WarrantyCustomerInput
  piano_name: string
  serial_number: string | null
  sale_date: string
  warranty_months: number
  notes: string | null
}

export interface WarrantyCreateResponse {
  id: string
  sale_id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_address: string | null
  piano_id: string
  piano_name: string
  serial_number: string | null
  start_date: string
  end_date: string
  status: 'active' | 'expiring' | 'expired' | 'voided'
  days_remaining: number
  notes: string | null
  sale_date: string | null
  warranty_id: string | null
}

export function buildWarrantyNotes(): string {
  return [
    'Tất cả sản phẩm piano do Piano Solna cung cấp đều được bảo hành theo đúng cam kết.',
    '1. Thời hạn bảo hành',
    '- Thời gian bảo hành được ghi trên phiếu bảo hành hoặc hợp đồng mua bán.',
    '2. Phạm vi bảo hành',
    '- Lỗi kỹ thuật phát sinh do nhà sản xuất.',
    '- Hư hỏng do linh kiện bị lỗi trong điều kiện sử dụng bình thường.',
    '3. Trường hợp không được bảo hành miễn phí',
    '- Hư hỏng do va đập, rơi vỡ, ngập nước, cháy nổ hoặc tác động ngoại lực.',
    '- Tự ý sửa chữa, thay đổi linh kiện ngoài hệ thống Piano Solna.',
    '- Bảo quản trong môi trường ẩm mốc, nhiệt độ hoặc độ ẩm không phù hợp.',
  ].join('\n')
}

export function createWarrantySale(payload: WarrantyCreateRequest) {
  return api<WarrantyCreateResponse>('/warranties', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
